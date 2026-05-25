<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponse;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthService $authService) {}

    public function register(RegisterRequest $request)
    {
        $this->authService->registerUser($request->validated());

        return $this->success(null, __('auth.register_success'), 201);
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return $this->error(__('auth.invalid_credentials'), 401);
        }

        $user = Auth::user();

        if ($user->is_banned) {
            Auth::guard('web')->logout();
            return $this->error(__('auth.account_suspended'), 403);
        }

        if (!$user->email_verified_at) {
            Auth::guard('web')->logout();
            return $this->error(__('auth.verify_email_first'), 401);
        }

        $request->session()->regenerate();

        if ($user->role === 'job_seeker') {
            $user->load('jobSeekerProfile');
        } elseif ($user->role === 'company') {
            $user->load('companyProfile');
        }

        return $this->success(new UserResource($user), __('auth.login_success'), 200);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, __('auth.logout_success'));
    }

    public function verifyEmail(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        if (!$this->authService->verifyEmail($request->token)) {
            return $this->error(__('auth.invalid_or_expired_token'), 400);
        }

        return $this->success(null, __('auth.email_verified'));
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'job_seeker') {
            $user->load('jobSeekerProfile');
        } elseif ($user->role === 'company') {
            $user->load('companyProfile');
        }

        return $this->success(new UserResource($user), __('messages.ok'), 200);
    }

    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $this->authService->resendVerificationEmail($request->email);

        // Always return 200 to prevent user enumeration
        return $this->success(null, __('auth.verification_link_sent'), 200);
    }
}
