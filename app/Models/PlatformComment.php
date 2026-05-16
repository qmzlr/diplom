<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformComment extends Model
{
    protected $fillable = [
        'userId',
        'author',
        'text',
        'target',
        'target_type',
        'target_code',
        'status',
    ];

    public function toFrontend(): array
    {
        return [
            'id' => 'c-'.$this->id,
            'author' => $this->author,
            'text' => $this->text,
            'target' => $this->target,
            'targetType' => $this->target_type,
            'targetCode' => $this->target_code,
            'targetUrl' => $this->targetUrl(),
            'status' => $this->status,
        ];
    }

    private function targetUrl(): ?string
    {
        if ($this->target_type === 'course' && $this->target_code) {
            return '/courses/'.$this->target_code;
        }

        if ($this->target_type === 'lesson' && $this->target_code) {
            $lesson = Lesson::query()->with('course')->where('code', $this->target_code)->first();

            if ($lesson?->course) {
                return '/courses/'.$lesson->course->code.'/lessons/'.$lesson->code;
            }
        }

        if ($this->target_type === 'video' && $this->target_code) {
            return '/community/videos/'.$this->target_code;
        }

        return null;
    }
}
