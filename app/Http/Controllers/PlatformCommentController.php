<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\PlatformComment;
use App\Models\User;
use App\Models\UserVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformCommentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'comments' => PlatformComment::query()
                ->with(['course', 'lesson.course', 'video'])
                ->latest()
                ->get()
                ->map(fn (PlatformComment $comment) => $comment->toFrontend()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->user($request);
        abort_if(! $user, 403);

        $validated = $request->validate([
            'text' => ['required', 'string'],
            'targetType' => ['required', Rule::in(['course', 'lesson', 'video', 'platform'])],
            'targetCode' => ['required', 'string', 'max:128'],
        ]);

        $target = $this->resolveTarget($validated['targetType'], $validated['targetCode'], $user);

        $comment = PlatformComment::query()->create([
            'userId' => $user->id,
            'author' => $user->name ?: 'Ученик',
            'text' => $validated['text'],
            'target' => $target['label'],
            'target_type' => $validated['targetType'],
            'target_code' => $target['code'],
            'course_id' => $target['course_id'] ?? null,
            'lesson_id' => $target['lesson_id'] ?? null,
            'user_video_id' => $target['user_video_id'] ?? null,
            'status' => 'ожидает',
        ]);

        return response()->json([
            'comment' => $comment->toFrontend(),
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['ожидает', 'одобрено', 'отклонено'])],
        ]);

        $comment = PlatformComment::query()->findOrFail($id);
        $comment->update($validated);

        return response()->json([
            'comment' => $comment->toFrontend(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        PlatformComment::query()->findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    private function user(Request $request): ?User
    {
        $userId = $request->session()->get('user_id');

        return $userId ? User::query()->find($userId) : null;
    }

    /**
     * @return array{label: string, code: string, course_id?: int, lesson_id?: int, user_video_id?: int}
     */
    private function resolveTarget(string $type, string $code, User $user): array
    {
        if ($type === 'course') {
            $course = Course::query()->where('code', $code)->where('status', 'опубликовано')->firstOrFail();
            $isEnrolled = CourseEnrollment::query()
                ->where('userId', $user->id)
                ->where('course_id', $course->id)
                ->exists();

            abort_if(! $isEnrolled, 403);

            return ['label' => $course->title, 'code' => $course->code, 'course_id' => $course->id];
        }

        if ($type === 'lesson') {
            $lesson = Lesson::query()->with('course')->where('code', $code)->firstOrFail();
            abort_if($lesson->course?->status !== 'опубликовано', 404);
            $isCompleted = LessonProgress::query()
                ->where('userId', $user->id)
                ->where('lesson_id', $lesson->id)
                ->where('completed', true)
                ->exists();

            abort_if(! $isCompleted, 403);

            return [
                'label' => ($lesson->course?->title ?? 'Курс').' · '.$lesson->title,
                'code' => $lesson->code,
                'lesson_id' => $lesson->id,
            ];
        }

        if ($type === 'video') {
            $video = UserVideo::query()
                ->where('status', 'опубликовано')
                ->findOrFail((int) $code);

            return ['label' => $video->title, 'code' => (string) $video->id, 'user_video_id' => $video->id];
        }

        return ['label' => 'PlayNote', 'code' => 'platform'];
    }
}
