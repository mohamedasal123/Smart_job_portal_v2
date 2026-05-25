<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        if ($locale) {
            App::setLocale($locale);
        }

        return $next($request);
    }

    private function resolveLocale(Request $request): ?string
    {
        $candidate = $request->header('X-Locale')
            ?: $request->query('locale')
            ?: $request->getPreferredLanguage(self::SUPPORTED);

        if (!$candidate) {
            return null;
        }

        $short = strtolower(substr($candidate, 0, 2));

        return in_array($short, self::SUPPORTED, true) ? $short : null;
    }
}
