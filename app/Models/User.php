<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class User extends Model
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'unionId',
        'name',
        'email',
        'password',
        'avatar',
        'role',
        'teacher_status',
        'teacher_documents',
        'instrument',
        'level',
        'lastSignInAt',
    ];

    protected $hidden = [
        'createdAt',
        'updatedAt',
        'lastSignInAt',
        'password',
    ];

    protected function casts(): array
    {
        return [
            'createdAt' => 'datetime',
            'updatedAt' => 'datetime',
            'lastSignInAt' => 'datetime',
            'teacher_documents' => 'array',
        ];
    }

    public function instruments(): BelongsToMany
    {
        return $this->belongsToMany(Instrument::class, 'user_instruments', 'userId', 'instrument_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class, 'userId');
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class, 'userId');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(UserVideo::class, 'userId');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PlatformComment::class, 'userId');
    }

    public function courseRequests(): HasMany
    {
        return $this->hasMany(CourseRequest::class, 'userId');
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
