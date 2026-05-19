<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $this->user($request);
        abort_if(! $user, 403, 'Нужно войти в аккаунт.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:320',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'avatar' => ['nullable', 'string', 'max:1024'],
            'level' => ['nullable', 'string', 'max:64'],
            'instrumentIds' => ['sometimes', 'array'],
            'instrumentIds.*' => ['string', 'exists:instruments,slug'],
        ]);

        $instrumentIds = $validated['instrumentIds'] ?? null;
        unset($validated['instrumentIds']);

        if ($instrumentIds !== null) {
            $firstInstrument = Instrument::query()
                ->whereIn('slug', $instrumentIds)
                ->orderByRaw($this->instrumentOrderSql($instrumentIds))
                ->first();

            $validated['instrument'] = $firstInstrument?->name;
        }

        $user->update($validated);

        if ($instrumentIds !== null) {
            $instrumentPrimaryKeys = Instrument::query()
                ->whereIn('slug', $instrumentIds)
                ->pluck('id')
                ->all();

            $user->instruments()->sync($instrumentPrimaryKeys);
        }

        return response()->json([
            'user' => $user->fresh()?->load('instruments'),
            'instruments' => $user->fresh()?->instruments->map(fn (Instrument $instrument) => $instrument->toFrontend())->values(),
        ]);
    }

    public function avatar(Request $request): JsonResponse
    {
        $user = $this->user($request);
        abort_if(! $user, 403, 'Нужно войти в аккаунт.');

        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $avatar = '/storage/'.$path;

        $user->update(['avatar' => $avatar]);

        return response()->json([
            'avatar' => $avatar,
            'user' => $user->fresh(),
        ]);
    }

    private function user(Request $request): ?User
    {
        $userId = $request->session()->get('user_id');

        return $userId ? User::query()->find($userId) : null;
    }

    /**
     * Preserve the first selected instrument as the legacy primary instrument.
     */
    private function instrumentOrderSql(array $instrumentIds): string
    {
        $cases = collect($instrumentIds)
            ->values()
            ->map(fn (string $slug, int $index) => "WHEN '".str_replace("'", "''", $slug)."' THEN {$index}")
            ->implode(' ');

        return "CASE slug {$cases} ELSE 999 END";
    }
}
