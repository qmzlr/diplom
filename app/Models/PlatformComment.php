<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformComment extends Model
{
    protected $fillable = [
        'userId',
        'author',
        'text',
        'target',
        'target_type',
        'target_code',
        'course_id',
        'lesson_id',
        'user_video_id',
        'status',
    ];

    protected static function booted(): void
    {
        static::saving(function (PlatformComment $comment): void {
            if ($comment->target_type === 'course' && $comment->course_id === null && $comment->target_code) {
                $comment->course_id = Course::query()->where('code', $comment->target_code)->value('id');
            }

            if ($comment->target_type === 'lesson' && $comment->lesson_id === null && $comment->target_code) {
                $comment->lesson_id = Lesson::query()->where('code', $comment->target_code)->value('id');
            }

            if ($comment->target_type === 'video' && $comment->user_video_id === null && $comment->target_code) {
                $comment->user_video_id = UserVideo::query()->whereKey((int) $comment->target_code)->value('id');
            }
        });
    }

    public function toFrontend(): array
    {
        return [
            'id' => 'c-'.$this->id,
            'author' => $this->author,
            'text' => $this->text,
            'target' => $this->target,
            'targetType' => $this->target_type,
            'targetCode' => $this->resolvedTargetCode(),
            'targetUrl' => $this->targetUrl(),
            'status' => $this->status,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(UserVideo::class, 'user_video_id');
    }

    private function targetUrl(): ?string
    {
        if ($this->target_type === 'course') {
            $code = $this->course?->code ?? $this->target_code;

            return $code ? '/courses/'.$code : null;
        }

        if ($this->target_type === 'lesson') {
            $lesson = $this->lesson ?? ($this->target_code ? Lesson::query()->with('course')->where('code', $this->target_code)->first() : null);

            if ($lesson?->course) {
                return '/courses/'.$lesson->course->code.'/lessons/'.$lesson->code;
            }
        }

        if ($this->target_type === 'video') {
            $id = $this->video?->id ?? $this->target_code;

            return $id ? '/community/videos/'.$id : null;
        }

        return null;
    }

    private function resolvedTargetCode(): ?string
    {
        if ($this->target_type === 'course') {
            return $this->course?->code ?? $this->target_code;
        }

        if ($this->target_type === 'lesson') {
            return $this->lesson?->code ?? $this->target_code;
        }

        if ($this->target_type === 'video') {
            return $this->video?->id ? (string) $this->video->id : $this->target_code;
        }

        return $this->target_code;
    }
}
