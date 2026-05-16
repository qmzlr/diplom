<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSessionAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('user_id')) {
            if ($request->expectsJson()) {
                abort(403);
            }

            return redirect()->route('login');
        }

        return $next($request);
    }
}
