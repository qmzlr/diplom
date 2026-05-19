<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\UserVideo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserVideoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'videos' => UserVideo::query()
                ->with('user')
                ->latest()
                ->get()
                ->map(fn (UserVideo $video) => $video->toFrontend()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instrument' => ['required', 'string', 'max:128'],
            'image' => ['nullable', 'string', 'max:255'],
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/webm', 'max:102400'],
        ]);

        $videoPath = $request->file('video')->store('videos/community', 'public');

        $video = UserVideo::query()->create([
            ...$validated,
            'userId' => $request->session()->get('user_id'),
            'instrument_id' => Instrument::query()->where('name', $validated['instrument'])->value('id'),
            'image' => $validated['image'] ?? '/images/course-theory.jpg',
            'video' => '/storage/'.$videoPath,
            'status' => 'на модерации',
        ]);

        return response()->json([
            'video' => $video->load('user')->toFrontend(),
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['опубликовано', 'на модерации', 'отклонено'])],
        ]);

        $video = UserVideo::query()->findOrFail($id);
        $video->update($validated);

        return response()->json([
            'video' => $video->load('user')->toFrontend(),
        ]);
    }
}
