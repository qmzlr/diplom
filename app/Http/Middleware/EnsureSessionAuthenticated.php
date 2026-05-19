<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSessionAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get('user_id');
        $user = $userId ? User::query()->find($userId) : null;

        if (! $user || $user->is_banned) {
            if ($user?->is_banned) {
                $request->session()->forget('user_id');
            }

            if ($request->expectsJson()) {
                abort(403);
            }

            return redirect()->route('login');
        }

        return $next($request);
    }
}
