<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instrument;
use App\Models\PlatformComment;
use App\Models\UserVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->session()->get('user_id');

        $courses = Course::query()
            ->with('lessonList')
            ->where('status', 'опубликовано')
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => $course->toFrontend(true, $userId));

        $instruments = Instrument::query()
            ->orderBy('id')
            ->get()
            ->map(fn (Instrument $instrument) => $instrument->toFrontend());

        $userVideos = UserVideo::query()
            ->latest()
            ->get()
            ->map(fn (UserVideo $video) => $video->toFrontend());

        $comments = PlatformComment::query()
            ->latest()
            ->get()
            ->map(fn (PlatformComment $comment) => $comment->toFrontend());

        return response()->json([
            'courses' => $courses,
            'instruments' => $instruments,
            'recommendations' => $courses->take(4)->values(),
            'userVideos' => $userVideos,
            'comments' => $comments,
            'adminStats' => [
                ['Пользователи', '1 248'],
                ['Курсы', (string) $courses->count()],
                ['Видео', (string) max(412, $userVideos->count())],
                ['Комментарии', (string) max(3906, $comments->count())],
            ],
        ]);
    }
}
