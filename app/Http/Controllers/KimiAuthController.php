<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KimiAuthController extends Controller
{
    public function callback(Request $request): RedirectResponse
    {
        $unionId = (string) $request->query('unionId', 'kimi-demo-user');

        $user = User::query()->updateOrCreate(
            ['unionId' => $unionId],
            [
                'name' => $request->query('name', 'PlayNote Student'),
                'email' => $request->query('email'),
                'avatar' => $request->query('avatar'),
                'lastSignInAt' => now(),
            ],
        );

        abort_if($user->is_banned, 403, 'Аккаунт заблокирован.');

        $request->session()->put('user_id', $user->id);
        $request->session()->regenerate();

        return redirect()->route('profile');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->forget('user_id');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }
}
