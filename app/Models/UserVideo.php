<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserVideo extends Model
{
    protected $fillable = [
        'userId',
        'instrument_id',
        'title',
        'description',
        'instrument',
        'status',
        'image',
        'video',
    ];

    protected static function booted(): void
    {
        static::saving(function (UserVideo $video): void {
            if ($video->instrument_id === null && $video->instrument) {
                $video->instrument_id = Instrument::query()->where('name', $video->instrument)->value('id');
            }
        });
    }

    public function toFrontend(): array
    {
        return [
            'id' => 'uv-'.$this->id,
            'title' => $this->title,
            'description' => $this->description,
            'author' => $this->user?->name ?: 'PlayNote',
            'authorAvatar' => $this->user?->avatar,
            'instrument' => $this->instrument,
            'status' => $this->status,
            'image' => $this->image,
            'video' => $this->video,
            'detailUrl' => '/community/videos/'.$this->id,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function instrumentModel(): BelongsTo
    {
        return $this->belongsTo(Instrument::class, 'instrument_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PlatformComment::class);
    }
}
