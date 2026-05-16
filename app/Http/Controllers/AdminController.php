<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\PlatformComment;
use App\Models\User;
use App\Models\UserVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function storeUser(Request $request): JsonResponse
    {
        $validated = $this->validatedUser($request);
        $instrumentIds = $validated['instrumentIds'] ?? [];
        unset($validated['instrumentIds']);
        $validated = $this->normalizeTeacherStatus($validated);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user = User::query()->create([
            ...$validated,
            'unionId' => 'admin:'.uniqid('', true),
            'lastSignInAt' => now(),
        ]);

        $this->syncUserInstruments($user, $instrumentIds);

        return response()->json(['user' => $this->userPayload($user->fresh())], 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        $validated = $this->validatedUser($request, $user);
        $instrumentIds = $validated['instrumentIds'] ?? null;
        unset($validated['instrumentIds']);
        $validated = $this->normalizeTeacherStatus($validated);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($instrumentIds !== null) {
            $this->syncUserInstruments($user, $instrumentIds);
        }

        return response()->json(['user' => $this->userPayload($user->fresh())]);
    }

    public function destroyUser(Request $request, int $id): JsonResponse
    {
        abort_if((int) $request->session()->get('user_id') === $id, 422, 'Нельзя удалить текущего администратора.');

        User::query()->findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    public function storeInstrument(Request $request): JsonResponse
    {
        $validated = $this->validatedInstrument($request);
        $instrument = Instrument::query()->create($validated);

        return response()->json(['instrument' => $instrument->toFrontend()], 201);
    }

    public function updateInstrument(Request $request, string $slug): JsonResponse
    {
        $instrument = Instrument::query()->where('slug', $slug)->firstOrFail();
        $instrument->update($this->validatedInstrument($request, $instrument->id));

        return response()->json(['instrument' => $instrument->fresh()?->toFrontend()]);
    }

    public function destroyInstrument(string $slug): JsonResponse
    {
        Instrument::query()->where('slug', $slug)->firstOrFail()->delete();

        return response()->json(['success' => true]);
    }

    public function destroyVideo(int $id): JsonResponse
    {
        UserVideo::query()->findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:102400'],
            'type' => ['required', Rule::in(['image', 'video', 'avatar'])],
        ]);

        $rules = [
            'image' => ['image'],
            'avatar' => ['image'],
            'video' => ['mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/webm'],
        ];

        $request->validate([
            'file' => $rules[$validated['type']],
        ]);

        $directory = match ($validated['type']) {
            'avatar' => 'avatars',
            'video' => 'videos/admin',
            default => 'images/admin',
        };

        $path = $request->file('file')->store($directory, 'public');

        return response()->json([
            'path' => '/storage/'.$path,
        ]);
    }

    private function validatedUser(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:320',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['user', 'admin', 'moderator', 'teacher'])],
            'teacherStatus' => ['nullable', Rule::in(['ожидает', 'одобрен', 'отклонён'])],
            'level' => ['nullable', 'string', 'max:64'],
            'avatar' => ['nullable', 'string', 'max:1024'],
            'instrumentIds' => ['sometimes', 'array'],
            'instrumentIds.*' => ['string', Rule::exists('instruments', 'slug')],
        ]);
    }

    private function validatedInstrument(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'slug' => ['required', 'string', 'max:128', Rule::unique('instruments', 'slug')->ignore($ignoreId)],
            'name' => ['required', 'string', 'max:128'],
            'image' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
        ]);
    }

    /**
     * @param array<int, string> $instrumentIds
     */
    private function syncUserInstruments(User $user, array $instrumentIds): void
    {
        $instruments = Instrument::query()
            ->whereIn('slug', $instrumentIds)
            ->get()
            ->sortBy(fn (Instrument $instrument) => array_search($instrument->slug, $instrumentIds, true));

        $user->instruments()->sync($instruments->pluck('id')->all());
        $user->update(['instrument' => $instruments->first()?->name]);
    }

    private function userPayload(?User $user): array
    {
        abort_if(! $user, 404);

        $user->load('instruments');

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'teacherStatus' => $user->teacher_status,
            'instrument' => $user->instrument,
            'level' => $user->level,
            'instrumentIds' => $user->instruments->pluck('slug')->values()->all(),
            'createdAt' => $user->createdAt?->toJSON(),
            'lastSignInAt' => $user->lastSignInAt?->toJSON(),
        ];
    }

    private function normalizeTeacherStatus(array $payload): array
    {
        if (array_key_exists('teacherStatus', $payload)) {
            $payload['teacher_status'] = $payload['teacherStatus'];
            unset($payload['teacherStatus']);
        }

        if (($payload['role'] ?? null) !== 'teacher') {
            $payload['teacher_status'] = null;
        } elseif (empty($payload['teacher_status'])) {
            $payload['teacher_status'] = 'ожидает';
        }

        return $payload;
    }
}
