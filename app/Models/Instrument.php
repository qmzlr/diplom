<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instrument extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'image',
        'description',
        'course_count',
    ];

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(UserVideo::class);
    }

    public function courseRequests(): HasMany
    {
        return $this->hasMany(CourseRequest::class);
    }

    public function toFrontend(): array
    {
        return [
            'id' => $this->slug,
            'name' => $this->name,
            'image' => $this->image,
            'description' => $this->description,
            'courseCount' => Course::query()->where('instrument_id', $this->id)->count(),
        ];
    }
}
