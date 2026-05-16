<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LocalAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:320'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Неверный email или пароль.',
            ]);
        }

        $user->update(['lastSignInAt' => now()]);
        $request->session()->put('user_id', $user->id);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:320', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'instrument' => ['nullable', 'string', 'max:128'],
            'instrumentIds' => ['sometimes', 'array'],
            'instrumentIds.*' => ['string', Rule::exists('instruments', 'slug')],
            'level' => ['nullable', 'string', 'max:64'],
            'accountType' => ['sometimes', Rule::in(['student', 'teacher'])],
        ]);

        $selectedSlugs = $validated['instrumentIds'] ?? [];
        $selectedInstruments = Instrument::query()
            ->whereIn('slug', $selectedSlugs)
            ->get()
            ->sortBy(fn (Instrument $instrument) => array_search($instrument->slug, $selectedSlugs, true));
        $primaryInstrument = $selectedInstruments->first()?->name ?? $validated['instrument'] ?? null;

        $isTeacher = ($validated['accountType'] ?? 'student') === 'teacher';

        $user = User::query()->create([
            'unionId' => 'local:'.mb_strtolower($validated['email']),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'instrument' => $primaryInstrument,
            'level' => $isTeacher ? null : ($validated['level'] ?? null),
            'role' => $isTeacher ? 'teacher' : 'user',
            'teacher_status' => $isTeacher ? 'ожидает' : null,
            'lastSignInAt' => now(),
        ]);

        if ($selectedInstruments->isNotEmpty()) {
            $user->instruments()->sync($selectedInstruments->pluck('id')->all());
        }

        $request->session()->put('user_id', $user->id);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'user' => $user,
        ], 201);
    }
}
