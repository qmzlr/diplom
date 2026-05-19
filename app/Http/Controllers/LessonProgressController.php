<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\CourseEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonProgressController extends Controller
{
    public function update(Request $request, Lesson $lesson): JsonResponse
    {
        $userId = $request->session()->get('user_id');
        abort_if(! $userId, 403, 'Нужно войти в аккаунт.');

        $validated = $request->validate([
            'completed' => ['required', 'boolean'],
        ]);

        $progress = LessonProgress::query()->updateOrCreate(
            [
                'userId' => $userId,
                'lesson_id' => $lesson->id,
            ],
            [
                'completed' => $validated['completed'],
                'completedAt' => $validated['completed'] ? now() : null,
            ],
        );

        $course = $lesson->course()->with('lessonList')->firstOrFail();
        CourseEnrollment::query()->firstOrCreate(
            [
                'userId' => $userId,
                'course_id' => $course->id,
            ],
            [
                'startedAt' => now(),
            ],
        );

        return response()->json([
            'lesson' => $lesson->toFrontend($progress->completed),
            'course' => $course->toFrontend(true, (int) $userId),
        ]);
    }
}
