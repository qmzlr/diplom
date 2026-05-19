<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instrument;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        return response()->json([
            'courses' => Course::query()
                ->with(['lessonList', 'owner'])
                ->where('status', 'опубликовано')
                ->orderBy('code')
                ->get()
                ->map(fn (Course $course) => $course->toFrontend(true, $userId)),
        ]);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $course = Course::query()
            ->with(['lessonList', 'owner'])
            ->where('code', $code)
            ->firstOrFail();

        abort_if($course->status !== 'опубликовано', 404, 'Курс не найден.');

        return response()->json([
            'course' => $course->toFrontend(true, $request->session()->get('user_id')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedCourse($request);
        $lessons = $validated['lessonList'] ?? [];
        unset($validated['lessonList']);

        $user = $this->user($request);
        $this->ensureCanManageCourse($user);

        $course = Course::query()->create($this->toDatabasePayload($validated, null, $user));
        $this->syncLessons($course, $lessons);

        return response()->json([
            'course' => $course->load('lessonList')->toFrontend(),
        ], 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $course = Course::query()->where('code', $code)->firstOrFail();
        $user = $this->user($request);
        $this->ensureCanManageCourse($user, $course);

        $validated = $this->validatedCourse($request, $course->id);
        $lessons = $validated['lessonList'] ?? null;
        unset($validated['lessonList']);

        $course->update($this->toDatabasePayload($validated, $course, $user));

        if (is_array($lessons)) {
            $this->syncLessons($course, $lessons);
        }

        return response()->json([
            'course' => $course->load('lessonList')->toFrontend(),
        ]);
    }

    public function destroy(Request $request, string $code): JsonResponse
    {
        $course = Course::query()->where('code', $code)->firstOrFail();
        $this->ensureCanManageCourse($this->user($request), $course);
        $course->delete();

        return response()->json(['success' => true]);
    }

    private function validatedCourse(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'id' => [
                'required',
                'string',
                'max:16',
                Rule::unique('courses', 'code')->ignore($ignoreId),
            ],
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:128'],
            'instrument' => ['required', 'string', 'max:128'],
            'img' => ['required', 'string', 'max:255'],
            'tagline' => ['required', 'string', 'max:255'],
            'shortDescription' => ['required', 'string'],
            'description' => ['required', 'array'],
            'features' => ['required', 'array'],
            'outcomes' => ['required', 'array'],
            'lessons' => ['required', 'string', 'max:128'],
            'lessonCount' => ['required', 'integer', 'min:0'],
            'level' => ['required', 'string', 'max:128'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'video' => ['required', 'string', 'max:255'],
            'lessonList' => ['sometimes', 'array'],
            'lessonList.*.id' => ['required_with:lessonList', 'string', 'max:64'],
            'lessonList.*.title' => ['required_with:lessonList', 'string', 'max:255'],
            'lessonList.*.description' => ['required_with:lessonList', 'string'],
            'lessonList.*.duration' => ['required_with:lessonList', 'string', 'max:64'],
            'lessonList.*.video' => ['required_with:lessonList', 'string', 'max:255'],
            'lessonList.*.completed' => ['sometimes', 'boolean'],
        ]);
    }

    private function toDatabasePayload(array $payload, ?Course $existing = null, ?User $user = null): array
    {
        $isTeacher = $user?->role === 'teacher';

        return [
            'code' => $payload['id'],
            'user_id' => $existing?->user_id ?? ($isTeacher ? $user?->id : null),
            'status' => $isTeacher ? 'на модерации' : ($existing?->status ?? 'опубликовано'),
            'instrument_id' => $this->instrumentIdFor($payload['instrument']),
            'title' => $payload['title'],
            'author' => $payload['author'],
            'category' => $payload['category'],
            'instrument' => $payload['instrument'],
            'image' => $payload['img'],
            'tagline' => $payload['tagline'],
            'short_description' => $payload['shortDescription'],
            'description' => $payload['description'],
            'features' => $payload['features'],
            'outcomes' => $payload['outcomes'],
            'lessons' => $payload['lessons'],
            'lesson_count' => $payload['lessonCount'],
            'level' => $payload['level'],
            'duration' => $existing?->duration ?? '',
            'duration_weeks' => $existing?->duration_weeks ?? 1,
            'progress' => $payload['progress'] ?? 0,
            'video' => $payload['video'],
        ];
    }

    private function syncLessons(Course $course, array $lessons): void
    {
        $course->lessonList()->delete();

        foreach ($lessons as $index => $lesson) {
            Lesson::query()->create([
                'course_id' => $course->id,
                'code' => $lesson['id'],
                'title' => $lesson['title'],
                'description' => $lesson['description'],
                'duration' => $lesson['duration'],
                'video' => $lesson['video'],
                'completed' => $lesson['completed'] ?? false,
                'position' => $index + 1,
            ]);
        }
    }

    private function user(Request $request): ?User
    {
        $userId = $request->session()->get('user_id');

        return $userId ? User::query()->find($userId) : null;
    }

    private function ensureCanManageCourse(?User $user, ?Course $course = null): void
    {
        abort_if(! $user, 403, 'Нужно войти в аккаунт.');

        if ($user->role === 'admin') {
            return;
        }

        abort_if($user->role !== 'teacher' || $user->teacher_status !== 'одобрен', 403, 'Доступ запрещён.');

        if ($course) {
            abort_if((int) $course->user_id !== (int) $user->id, 403, 'Доступ запрещён.');
        }
    }

    private function instrumentIdFor(string $name): ?int
    {
        if ($name === 'Любой инструмент') {
            return null;
        }

        return Instrument::query()->where('name', $name)->value('id');
    }
}
