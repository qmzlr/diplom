<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userId = $request->session()->get('user_id');
        $user = $userId ? User::query()->find($userId) : null;

        if (! $user || $user->is_banned || ! in_array($user->role, $roles, true)) {
            if ($user?->is_banned) {
                $request->session()->forget('user_id');
            }

            abort(403);
        }

        return $next($request);
    }
}
