<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseRequest extends Model
{
    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = null;

    protected $fillable = [
        'userId',
        'name',
        'email',
        'instrument',
        'level',
        'goal',
        'status',
    ];
}
