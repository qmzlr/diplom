<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseEnrollmentController extends Controller
{
    public function store(Request $request, string $courseCode): JsonResponse
    {
        $userId = $request->session()->get('user_id');
        abort_if(! $userId, 403, 'Нужно войти в аккаунт.');

        $course = Course::query()
            ->with('lessonList')
            ->where('code', $courseCode)
            ->where('status', 'опубликовано')
            ->firstOrFail();

        CourseEnrollment::query()->firstOrCreate(
            [
                'userId' => $userId,
                'course_id' => $course->id,
            ],
            [
                'startedAt' => now(),
            ],
        );

        $firstLesson = $course->lessonList->first();

        return response()->json([
            'course' => $course->toFrontend(true, (int) $userId),
            'lessonUrl' => $firstLesson ? route('lessons.show', [$course->code, $firstLesson->code], false) : null,
        ], 201);
    }
}
