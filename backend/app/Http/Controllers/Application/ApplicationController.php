<?php

namespace App\Http\Controllers\Application;

use App\Http\Controllers\Controller;
use App\Http\Requests\Application\ApplyRequest;
use App\Http\Requests\Application\UpdateStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Services\MatchingService;
use App\Services\GapAnalyzerService;
use App\Jobs\RefineApplicationScoreJob;
use App\Jobs\SendRejectionEmailJob;
use App\Jobs\SendApprovedEmailJob;
use App\Events\ApplicationStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Traits\ApiResponse;
use App\Models\JobPost;
use App\Models\Notification;

class ApplicationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private MatchingService $matchingService,
        private GapAnalyzerService $gapAnalyzerService
    ) {}

    public function index(Request $request)
    {
        $applications = Application::with(['jobPost.companyProfile', 'jobPost.jobRequiredSkills.skill'])
            ->where('job_seeker_id', $request->user()->jobSeekerProfile->id)
            ->paginate(15);

        return $this->success(ApplicationResource::collection($applications));
    }

    public function show(Request $request, Application $application)
    {
        if ($request->user()->cannot('view', $application)) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            new ApplicationResource(
                $application->load(['jobPost.companyProfile', 'jobPost.jobRequiredSkills.skill', 'applicationStatusHistory'])
            )
        );
    }

    public function store(ApplyRequest $request)
    {
        $profile = $request->user()->jobSeekerProfile;
        $jobId   = $request->job_id;

        $exists = Application::where('job_id', $jobId)
            ->where('job_seeker_id', $profile->id)
            ->exists();

        if ($exists) {
            return $this->error('Already applied to this job.', 409);
        }

        $job = JobPost::with(['jobRequiredSkills.skill', 'companyProfile.user'])->findOrFail($jobId);

        $seekerSkillIds = $profile->jobSeekerSkills()->pluck('skill_id');
        $requiredSkills = $job->jobRequiredSkills;

        // Compute a local score synchronously so the apply response is fast and
        // resilient to AI outages. RefineApplicationScoreJob upgrades these
        // values asynchronously when the AI service is reachable.
        $score = $this->matchingService->calculateLocalScore($seekerSkillIds, $requiredSkills);
        $missingSkills = $this->matchingService->getLocalMissingSkills($seekerSkillIds, $requiredSkills);

        $application = DB::transaction(function () use ($job, $jobId, $profile, $score, $missingSkills) {
            $app = Application::create([
                'job_id'             => $jobId,
                'job_seeker_id'      => $profile->id,
                'status'             => 'applied',
                'ai_score'           => $score,
                'missing_skills_json'=> $missingSkills,
            ]);

            $app->applicationStatusHistory()->create([
                'status'     => 'applied',
                'changed_by' => $profile->user_id,
                'created_at' => now(),
            ]);

            Notification::create([
                'user_id' => $job->companyProfile->user_id,
                'type' => 'application_submitted',
                'data' => [
                    'title' => 'New application received',
                    'message' => ($profile->user->name ?? 'A candidate') . ' applied to ' . $job->title . '.',
                    'application_id' => $app->id,
                    'job_id' => $job->id,
                    'job_title' => $job->title,
                    'candidate_name' => $profile->user->name ?? null,
                ],
                'created_at' => now(),
            ]);

            return $app;
        });

        RefineApplicationScoreJob::dispatch($application->id);

        return $this->success(new ApplicationResource($application), 'Applied successfully', 201);
    }

    public function updateStatus(UpdateStatusRequest $request, Application $application)
    {
        if ($request->user()->cannot('updateStatus', $application)) {
            return $this->error('Unauthorized', 403);
        }

        $newStatus = $request->status;

        DB::transaction(function () use ($application, $newStatus, $request) {
            if ($newStatus === 'rejected') {
                try {
                    $missingSkills = $this->gapAnalyzerService->analyze($application);
                    $application->missing_skills_json = $missingSkills;
                    SendRejectionEmailJob::dispatch($application);
                } catch (\Exception $e) {
                    \Log::error($e->getMessage());
                }
            }

            if ($newStatus === 'approved') {
                try {
                    Notification::create([
                        'user_id' => $application->jobSeekerProfile->user_id,
                        'type' => 'application_approved',
                        'data' => [
                            'title' => 'Application Approved',
                            'message' => 'Your application for ' . $application->jobPost->title . ' has been approved.',
                            'application_id' => $application->id,
                            'job_id' => $application->jobPost->id,
                            'job_title' => $application->jobPost->title,
                            'company_name' => $application->jobPost->companyProfile->company_name,
                        ],
                        'created_at' => now(),
                    ]);
                    SendApprovedEmailJob::dispatch($application);
                } catch (\Exception $e) {
                    \Log::error($e->getMessage());
                }
            }

            $application->status = $newStatus;
            $application->save();

            $application->applicationStatusHistory()->create([
                'status'     => $newStatus,
                'changed_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            try {
                event(new ApplicationStatusChanged($application));
            } catch (\Exception $e) {
                \Log::error($e->getMessage());
            }
        });

        return $this->success(new ApplicationResource($application), 'Status updated successfully');
    }

    public function feedback(Application $application)
    {
        if ($application->job_seeker_id !== auth()->user()->jobSeekerProfile->id) {
            return $this->error('Forbidden.', 403);
        }

        if ($application->status !== 'rejected') {
            return $this->error('Feedback only available for rejected applications.', 400);
        }

        return $this->success([
            'application_id'  => $application->id,
            'job_title'       => $application->jobPost->title,
            'ai_score'        => $application->ai_score,
            'missing_skills'  => $application->missing_skills_json ?? [],
            'status'          => $application->status,
        ], 'Feedback retrieved.');
    }

    public function destroy(Request $request, Application $application)
    {
        if ($request->user()->cannot('delete', $application)) {
            return $this->error('Unauthorized', 403);
        }

        DB::transaction(function () use ($application) {
            Notification::where('type', 'application_submitted')
                ->where('data->application_id', $application->id)
                ->delete();

            $application->delete();
        });

        return $this->success(null, 'Application withdrawn successfully.');
    }
}
