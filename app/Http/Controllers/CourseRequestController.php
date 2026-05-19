<?php

namespace App\Http\Controllers;

use App\Models\CourseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:320'],
            'instrument' => ['required', 'string', 'max:128'],
            'level' => ['required', 'string', 'max:64'],
            'goal' => ['required', 'string', 'max:255'],
            'privacyConsent' => ['accepted'],
        ]);

        $courseRequest = CourseRequest::query()->create([
            ...collect($validated)->except('privacyConsent')->all(),
            'userId' => $request->session()->get('user_id'),
        ]);

        return response()->json([
            'id' => $courseRequest->id,
            'success' => true,
        ]);
    }
}
