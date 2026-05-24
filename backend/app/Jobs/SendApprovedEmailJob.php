<?php

namespace App\Jobs;

use App\Models\Application;
use App\Mail\ApprovedEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendApprovedEmailJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public Application $application
    ) {}

    public function handle(): void
    {
        Mail::to($this->application->jobSeekerProfile->user->email)
            ->send(new ApprovedEmail($this->application));
    }
}
