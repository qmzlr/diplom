<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CourseRequestController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseEnrollmentController;
use App\Http\Controllers\InstrumentController;
use App\Http\Controllers\KimiAuthController;
use App\Http\Controllers\LessonProgressController;
use App\Http\Controllers\LocalAuthController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\PlatformCommentController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\PlatformPageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserVideoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [PlatformPageController::class, 'home'])->name('home');
Route::get('/courses', [PlatformPageController::class, 'courses'])->name('courses.index');
Route::get('/login', fn () => Inertia::render('Login'))->name('login');
Route::get('/register', [PlatformPageController::class, 'register'])->name('register');
Route::post('/login', [LocalAuthController::class, 'login'])->name('login.store');
Route::post('/register', [LocalAuthController::class, 'register'])->name('register.store');
Route::get('/courses/{courseId}', [PlatformPageController::class, 'courseDetail'])->name('courses.show');
Route::get('/courses/{courseId}/lessons/{lessonId}', [PlatformPageController::class, 'lesson'])->middleware('session.auth')->name('lessons.show');
Route::get('/instruments', [PlatformPageController::class, 'instruments'])->name('instruments.index');
Route::get('/metronome', fn () => Inertia::render('Metronome'))->name('metronome');
Route::redirect('/dashboard', '/profile')->name('dashboard');
Route::get('/profile', [PlatformPageController::class, 'profile'])->middleware('session.auth')->name('profile');
Route::get('/community', [PlatformPageController::class, 'community'])->name('community');
Route::get('/community/videos/{video}', [PlatformPageController::class, 'communityVideo'])->name('community.videos.show');
Route::get('/my-videos', [PlatformPageController::class, 'community'])->name('my-videos');
Route::get('/privacy', fn () => Inertia::render('Privacy'))->name('privacy');
Route::get('/moderator', [PlatformPageController::class, 'moderator'])->middleware('role:admin,moderator')->name('moderator');
Route::get('/admin', [PlatformPageController::class, 'admin'])->middleware('role:admin')->name('admin');
Route::get('/admin/courses/new', [PlatformPageController::class, 'courseEditor'])->middleware('role:admin')->name('admin.courses.new');
Route::get('/admin/courses/{courseId}/edit', [PlatformPageController::class, 'courseEditor'])->middleware('role:admin')->name('admin.courses.edit');
Route::get('/teacher', [PlatformPageController::class, 'teacher'])->middleware('role:teacher')->name('teacher');
Route::get('/teacher/courses/new', [PlatformPageController::class, 'courseEditor'])->middleware('role:teacher')->name('teacher.courses.new');
Route::get('/teacher/courses/{courseId}/edit', [PlatformPageController::class, 'courseEditor'])->middleware('role:teacher')->name('teacher.courses.edit');

Route::get('/api/oauth/callback', [KimiAuthController::class, 'callback'])
    ->name('kimi.callback');

Route::post('/logout', [KimiAuthController::class, 'logout'])
    ->name('logout');

Route::post('/course-requests', [CourseRequestController::class, 'store'])
    ->name('course-requests.store');

Route::prefix('api')->name('api.')->group(function () {
    Route::get('/platform', [PlatformController::class, 'index'])->name('platform.index');

    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('/courses/{courseCode}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('/courses/{courseCode}/enroll', [CourseEnrollmentController::class, 'store'])->middleware('session.auth')->name('courses.enroll');
    Route::post('/courses', [CourseController::class, 'store'])->middleware('role:admin,teacher')->name('courses.store');
    Route::put('/courses/{courseCode}', [CourseController::class, 'update'])->middleware('role:admin,teacher')->name('courses.update');
    Route::delete('/courses/{courseCode}', [CourseController::class, 'destroy'])->middleware('role:admin,teacher')->name('courses.destroy');

    Route::get('/instruments', [InstrumentController::class, 'index'])->name('instruments.index');

    Route::get('/videos', [UserVideoController::class, 'index'])->name('videos.index');
    Route::post('/videos', [UserVideoController::class, 'store'])->middleware('role:user,admin,moderator')->name('videos.store');
    Route::patch('/videos/{video}/status', [UserVideoController::class, 'updateStatus'])->middleware('role:admin,moderator')->name('videos.status');
    Route::patch('/teachers/{teacher}/status', [ModerationController::class, 'updateTeacherStatus'])->middleware('role:admin,moderator')->name('teachers.status');
    Route::patch('/courses/{courseCode}/status', [ModerationController::class, 'updateCourseStatus'])->middleware('role:admin,moderator')->name('courses.status');
    Route::patch('/lessons/{lesson}/progress', [LessonProgressController::class, 'update'])->name('lessons.progress');

    Route::get('/comments', [PlatformCommentController::class, 'index'])->name('comments.index');
    Route::post('/comments', [PlatformCommentController::class, 'store'])->middleware('session.auth')->name('comments.store');
    Route::patch('/comments/{comment}/status', [PlatformCommentController::class, 'updateStatus'])->middleware('role:admin,moderator')->name('comments.status');

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
        Route::post('/uploads', [AdminController::class, 'upload'])->name('uploads.store');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');
        Route::post('/instruments', [AdminController::class, 'storeInstrument'])->name('instruments.store');
        Route::put('/instruments/{instrument}', [AdminController::class, 'updateInstrument'])->name('instruments.update');
        Route::delete('/instruments/{instrument}', [AdminController::class, 'destroyInstrument'])->name('instruments.destroy');
        Route::delete('/videos/{video}', [AdminController::class, 'destroyVideo'])->name('videos.destroy');
        Route::delete('/comments/{comment}', [PlatformCommentController::class, 'destroy'])->name('comments.destroy');
    });

    Route::patch('/profile', [ProfileController::class, 'update'])->middleware('session.auth')->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'avatar'])->middleware('session.auth')->name('profile.avatar');
});
