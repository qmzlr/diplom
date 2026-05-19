<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseRequest extends Model
{
    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = null;

    protected $fillable = [
        'userId',
        'instrument_id',
        'name',
        'email',
        'instrument',
        'level',
        'goal',
        'status',
    ];

    protected static function booted(): void
    {
        static::saving(function (CourseRequest $request): void {
            if ($request->instrument_id === null && $request->instrument) {
                $request->instrument_id = Instrument::query()->where('name', $request->instrument)->value('id');
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function instrumentModel(): BelongsTo
    {
        return $this->belongsTo(Instrument::class, 'instrument_id');
    }
}
