<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserVideo extends Model
{
    protected $fillable = [
        'userId',
        'title',
        'description',
        'instrument',
        'status',
        'image',
        'video',
    ];

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
}
