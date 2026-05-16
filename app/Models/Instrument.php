<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Instrument extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'image',
        'description',
        'course_count',
    ];

    public function toFrontend(): array
    {
        return [
            'id' => $this->slug,
            'name' => $this->name,
            'image' => $this->image,
            'description' => $this->description,
            'courseCount' => Course::query()->where('instrument', $this->name)->count(),
        ];
    }
}
