<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ModerationController extends Controller
{
    public function updateTeacherStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['ожидает', 'одобрен', 'отклонён'])],
        ]);

        $teacher = User::query()
            ->with('instruments')
            ->where('role', 'teacher')
            ->findOrFail($id);

        $teacher->update(['teacher_status' => $validated['status']]);

        return response()->json([
            'teacher' => $this->teacherPayload($teacher->fresh('instruments')),
        ]);
    }

    public function updateCourseStatus(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['на модерации', 'опубликовано', 'отклонено'])],
        ]);

        $course = Course::query()
            ->with(['lessonList', 'owner'])
            ->where('code', $code)
            ->firstOrFail();

        $course->update(['status' => $validated['status']]);

        return response()->json([
            'course' => $course->fresh(['lessonList', 'owner'])->toFrontend(),
        ]);
    }

    private function teacherPayload(User $teacher): array
    {
        return [
            'id' => (string) $teacher->id,
            'name' => $teacher->name,
            'email' => $teacher->email,
            'status' => $teacher->teacher_status ?? 'ожидает',
            'instrument' => $teacher->instrument,
            'instrumentIds' => $teacher->instruments->pluck('slug')->values()->all(),
            'instruments' => $teacher->instruments->pluck('name')->values()->all(),
        ];
    }
}
