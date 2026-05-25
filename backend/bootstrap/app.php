<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\EnsureEmailVerified;
use App\Http\Middleware\EnsureCVUploaded;
use App\Http\Middleware\BanCheck;
use App\Http\Middleware\SetLocale;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();

        $middleware->api(prepend: [SetLocale::class]);
        $middleware->web(prepend: [SetLocale::class]);

        $middleware->redirectGuestsTo(fn() => response()->json([
            'success' => false,
            'data' => null,
            'message' => __('messages.unauthenticated'),
            'errors' => null,
        ], 401));



        $middleware->alias([
            'role' => RoleMiddleware::class,
            'verified' => EnsureEmailVerified::class,
            'cv.uploaded' => EnsureCVUploaded::class,
            'ban.check' => BanCheck::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => __('messages.validation_failed'),
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => __('messages.unauthenticated'),
                    'errors' => null,
                ], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => __('messages.forbidden'),
                    'errors' => null,
                ], 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => __('messages.not_found'),
                    'errors' => null,
                ], 404);
            }
        });

        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => __('messages.database_error'),
                    'errors' => null,
                ], 500);
            }
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => $e->getMessage() ?: __('messages.http_error'),
                    'errors' => null,
                ], $e->getStatusCode());
            }
        });

    })->create();