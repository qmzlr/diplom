<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use Illuminate\Http\JsonResponse;

class InstrumentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'instruments' => Instrument::query()
                ->orderBy('id')
                ->get()
                ->map(fn (Instrument $instrument) => $instrument->toFrontend()),
        ]);
    }
}
