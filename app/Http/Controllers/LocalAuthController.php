<?php

namespace App\Http\Controllers;

use App\Models\EmailVerificationCode;
use App\Models\Instrument;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
            'emailVerificationCode' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'instrument' => ['nullable', 'string', 'max:128'],
            'instrumentIds' => ['sometimes', 'array'],
            'instrumentIds.*' => ['string', Rule::exists('instruments', 'slug')],
            'level' => ['nullable', 'string', 'max:64'],
            'accountType' => ['sometimes', Rule::in(['student', 'teacher'])],
            'teacherDocuments' => ['sometimes', 'array', 'max:8'],
            'teacherDocuments.*' => ['file', 'max:8192', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $this->verifyCode($email, 'registration', $validated['emailVerificationCode']);

        $selectedSlugs = $validated['instrumentIds'] ?? [];
        $selectedInstruments = Instrument::query()
            ->whereIn('slug', $selectedSlugs)
            ->get()
            ->sortBy(fn (Instrument $instrument) => array_search($instrument->slug, $selectedSlugs, true));
        $primaryInstrument = $selectedInstruments->first()?->name ?? $validated['instrument'] ?? null;

        $isTeacher = ($validated['accountType'] ?? 'student') === 'teacher';
        $teacherDocuments = $isTeacher ? $this->storeTeacherDocuments($request) : [];

        $user = User::query()->create([
            'unionId' => 'local:'.$email,
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make($validated['password']),
            'instrument' => $primaryInstrument,
            'level' => $isTeacher ? null : ($validated['level'] ?? null),
            'role' => $isTeacher ? 'teacher' : 'user',
            'teacher_status' => $isTeacher ? 'ожидает' : null,
            'teacher_documents' => $teacherDocuments,
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

    public function sendRegistrationCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:320', 'unique:users,email'],
        ], [
            'email.unique' => 'Аккаунт с таким email уже существует.',
        ]);

        $this->sendCode(
            $this->normalizeEmail($validated['email']),
            'registration',
            'Подтверждение регистрации',
            'Введите этот код на странице регистрации, чтобы подтвердить email и создать аккаунт.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Код подтверждения отправлен на почту.',
        ]);
    }

    public function sendPasswordResetCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:320', 'exists:users,email'],
        ], [
            'email.exists' => 'Пользователь с таким email не найден.',
        ]);

        $this->sendCode(
            $this->normalizeEmail($validated['email']),
            'password_reset',
            'Восстановление пароля',
            'Введите этот код на странице восстановления и задайте новый пароль.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Код восстановления отправлен на почту.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:320', 'exists:users,email'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $this->verifyCode($email, 'password_reset', $validated['code']);

        $user = User::query()->where('email', $email)->firstOrFail();
        $user->update([
            'password' => Hash::make($validated['password']),
            'lastSignInAt' => now(),
        ]);

        $request->session()->put('user_id', $user->id);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }

    private function sendCode(string $email, string $purpose, string $title, string $intro): void
    {
        $code = (string) random_int(100000, 999999);
        $ttlMinutes = 15;

        EmailVerificationCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->delete();

        EmailVerificationCode::query()->create([
            'email' => $email,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);

        Mail::send('emails.auth-code', [
            'title' => $title,
            'intro' => $intro,
            'code' => $code,
            'ttlMinutes' => $ttlMinutes,
        ], function ($message) use ($email, $title) {
            $message->to($email)->subject('PlayNote: '.$title);
        });
    }

    private function verifyCode(string $email, string $purpose, string $code): void
    {
        $verification = EmailVerificationCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest()
            ->first();

        if (! $verification || $verification->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => 'Код истёк или не найден. Запросите новый код.',
            ]);
        }

        if ($verification->attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => 'Слишком много попыток. Запросите новый код.',
            ]);
        }

        if (! Hash::check($code, $verification->code_hash)) {
            $verification->increment('attempts');

            throw ValidationException::withMessages([
                'code' => 'Неверный код подтверждения.',
            ]);
        }

        $verification->update(['consumed_at' => now()]);
    }

    /**
     * @return array<int, array{name: string, path: string, mime: string|null, size: int}>
     */
    private function storeTeacherDocuments(Request $request): array
    {
        $files = $request->file('teacherDocuments', []);

        if (! is_array($files)) {
            $files = [$files];
        }

        return collect($files)
            ->filter()
            ->map(function ($file) {
                $path = $file->store('teacher-documents', 'public');

                return [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ];
            })
            ->values()
            ->all();
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
