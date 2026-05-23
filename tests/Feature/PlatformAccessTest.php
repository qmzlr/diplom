<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseRequest;
use App\Models\EmailVerificationCode;
use App\Models\Instrument;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\PlatformComment;
use App\Models\User;
use App\Models\UserVideo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlatformAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_admin_routes_are_only_available_to_admins(): void
    {
        $user = $this->user('user');
        $moderator = $this->user('moderator');
        $admin = $this->user('admin');

        $this->get('/admin')->assertForbidden();
        $this->withSession(['user_id' => $user->id])->get('/admin')->assertForbidden();
        $this->withSession(['user_id' => $moderator->id])->get('/admin')->assertForbidden();
        $this->withSession(['user_id' => $admin->id])->get('/admin')->assertOk();

        $this->withSession(['user_id' => $user->id])->postJson('/api/courses', [])->assertForbidden();
    }

    public function test_admin_can_manage_users_instruments_and_content(): void
    {
        $admin = $this->user('admin', 'admin@example.com');
        $instrument = Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);
        $video = UserVideo::query()->create([
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'на модерации',
            'image' => '/images/course-guitar.jpg',
        ]);
        $comment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Text',
            'target' => 'Course',
            'target_type' => 'course',
            'target_code' => 'T1',
            'status' => 'ожидает',
        ]);

        $createdUser = $this->withSession(['user_id' => $admin->id])
            ->postJson('/api/admin/users', [
                'name' => 'Moderator',
                'email' => 'mod@example.com',
                'password' => 'secret123',
                'role' => 'moderator',
                'level' => 'Начинающий',
                'instrumentIds' => ['guitar'],
            ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'moderator')
            ->json('user.id');

        $this->withSession(['user_id' => $admin->id])
            ->putJson("/api/admin/users/{$createdUser}", [
                'name' => 'Moderator Updated',
                'email' => 'mod@example.com',
                'role' => 'admin',
                'level' => 'Базовый',
                'instrumentIds' => ['guitar'],
            ])
            ->assertOk()
            ->assertJsonPath('user.role', 'admin');

        $this->withSession(['user_id' => $admin->id])
            ->patchJson("/api/admin/users/{$createdUser}/ban", ['isBanned' => true])
            ->assertOk()
            ->assertJsonPath('user.isBanned', true);

        $this->withSession(['user_id' => $admin->id])
            ->patchJson("/api/admin/users/{$createdUser}/ban", ['isBanned' => false])
            ->assertOk()
            ->assertJsonPath('user.isBanned', false);

        $this->withSession(['user_id' => $admin->id])
            ->postJson('/api/admin/instruments', [
                'slug' => 'bass',
                'name' => 'Бас',
                'image' => '/images/course-guitar.jpg',
                'description' => 'Bass instrument',
            ])
            ->assertCreated()
            ->assertJsonPath('instrument.id', 'bass');

        $this->withSession(['user_id' => $admin->id])->deleteJson("/api/admin/videos/{$video->id}")->assertOk();
        $this->withSession(['user_id' => $admin->id])->deleteJson("/api/admin/comments/{$comment->id}")->assertOk();
        $this->withSession(['user_id' => $admin->id])->deleteJson('/api/admin/instruments/bass')->assertOk();

        $this->assertDatabaseMissing('user_videos', ['id' => $video->id]);
        $this->assertDatabaseMissing('platform_comments', ['id' => $comment->id]);
        $this->assertDatabaseHas('user_instruments', [
            'userId' => (int) $createdUser,
            'instrument_id' => $instrument->id,
        ]);
    }

    public function test_banned_user_cannot_access_authenticated_routes(): void
    {
        $user = $this->user('user', 'banned@example.com');
        $user->update(['is_banned' => true]);

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertRedirect('/login');

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/courses/T1/enroll')
            ->assertForbidden();
    }

    public function test_admin_upload_accepts_images_and_videos(): void
    {
        Storage::fake('public');
        $admin = $this->user('admin', 'admin@example.com');

        $image = $this->withSession(['user_id' => $admin->id])
            ->post('/api/admin/uploads', [
                'type' => 'image',
                'file' => UploadedFile::fake()->image('cover.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->json('path');

        $video = $this->withSession(['user_id' => $admin->id])
            ->post('/api/admin/uploads', [
                'type' => 'video',
                'file' => UploadedFile::fake()->create('lesson.mp4', 10, 'video/mp4'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->json('path');

        $this->assertStringStartsWith('/storage/images/admin/', $image);
        $this->assertStringStartsWith('/storage/videos/admin/', $video);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $image));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $video));
    }

    public function test_dashboard_is_only_available_to_authenticated_users(): void
    {
        $user = $this->user('user');

        $this->get('/dashboard')->assertRedirect('/profile');
        $this->get('/profile')->assertRedirect('/login');
        $this->withSession(['user_id' => $user->id])->get('/profile')->assertOk();
    }

    public function test_register_can_store_multiple_selected_instruments(): void
    {
        $guitar = Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);
        $piano = Instrument::query()->create([
            'slug' => 'piano',
            'name' => 'Фортепиано',
            'image' => '/images/course-piano.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);

        $this->createVerificationCode('new@example.com');

        $response = $this->postJson('/register', [
            'name' => 'Student',
            'email' => 'new@example.com',
            'emailVerificationCode' => '123456',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'instrumentIds' => ['guitar', 'piano'],
            'level' => 'Начинающий',
        ])->assertCreated();

        $userId = $response->json('user.id');

        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'instrument' => 'Гитара',
        ]);
        $this->assertDatabaseHas('user_instruments', ['userId' => $userId, 'instrument_id' => $guitar->id]);
        $this->assertDatabaseHas('user_instruments', ['userId' => $userId, 'instrument_id' => $piano->id]);
    }

    public function test_registration_email_code_can_be_requested_for_new_email_only(): void
    {
        $this->user('user', 'taken@example.com');

        $this->postJson('/register/email-code', [
            'email' => 'new@example.com',
        ])->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('email_verification_codes', [
            'email' => 'new@example.com',
            'purpose' => 'registration',
            'consumed_at' => null,
        ]);

        $this->postJson('/register/email-code', [
            'email' => 'taken@example.com',
        ])->assertJsonValidationErrors('email');
    }

    public function test_teacher_registration_creates_pending_teacher_application(): void
    {
        $guitar = Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);

        $this->createVerificationCode('teacher@example.com');

        $response = $this->postJson('/register', [
            'name' => 'Teacher',
            'email' => 'teacher@example.com',
            'emailVerificationCode' => '123456',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'accountType' => 'teacher',
            'instrumentIds' => ['guitar'],
        ])->assertCreated();

        $userId = $response->json('user.id');

        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'role' => 'teacher',
            'teacher_status' => 'ожидает',
            'instrument' => 'Гитара',
        ]);
        $this->assertDatabaseHas('user_instruments', ['userId' => $userId, 'instrument_id' => $guitar->id]);
    }

    public function test_teacher_course_creation_requires_approval_and_sends_course_to_moderation(): void
    {
        $pendingTeacher = $this->user('teacher', 'pending-teacher@example.com');
        $pendingTeacher->update(['teacher_status' => 'ожидает']);

        $this->withSession(['user_id' => $pendingTeacher->id])
            ->postJson('/api/courses', $this->courseFrontendPayload('T9'))
            ->assertForbidden();

        $approvedTeacher = $this->user('teacher', 'approved-teacher@example.com');
        $approvedTeacher->update(['teacher_status' => 'одобрен']);

        $this->withSession(['user_id' => $approvedTeacher->id])
            ->postJson('/api/courses', $this->courseFrontendPayload('T9'))
            ->assertCreated()
            ->assertJsonPath('course.status', 'на модерации')
            ->assertJsonPath('course.owner.id', (string) $approvedTeacher->id);

        $this->assertDatabaseHas('courses', [
            'code' => 'T9',
            'user_id' => $approvedTeacher->id,
            'status' => 'на модерации',
        ]);
    }

    public function test_moderator_can_approve_teachers_and_teacher_courses(): void
    {
        $moderator = $this->user('moderator', 'moderator@example.com');
        $teacher = $this->user('teacher', 'teacher@example.com');
        $teacher->update(['teacher_status' => 'ожидает']);
        $course = Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T9',
            'user_id' => $teacher->id,
            'status' => 'на модерации',
        ]);

        $this->withSession(['user_id' => $moderator->id])
            ->patchJson("/api/teachers/{$teacher->id}/status", ['status' => 'одобрен'])
            ->assertOk()
            ->assertJsonPath('teacher.status', 'одобрен');

        $this->withSession(['user_id' => $moderator->id])
            ->patchJson("/api/courses/{$course->code}/status", ['status' => 'опубликовано'])
            ->assertOk()
            ->assertJsonPath('course.status', 'опубликовано');

        $this->assertDatabaseHas('users', ['id' => $teacher->id, 'teacher_status' => 'одобрен']);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'status' => 'опубликовано']);
    }

    public function test_unpublished_courses_are_hidden_from_public_pages(): void
    {
        Course::query()->create($this->coursePayload());
        Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T2',
            'title' => 'Hidden Course',
            'status' => 'на модерации',
        ]);

        $this->get('/courses')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CoursesCatalog')
                ->has('courses', 1)
                ->where('courses.0.id', 'T1')
            );

        $this->get('/courses/T2')->assertNotFound();
    }

    public function test_moderator_routes_are_available_to_admins_and_moderators(): void
    {
        $user = $this->user('user');
        $moderator = $this->user('moderator');
        $admin = $this->user('admin');

        $this->get('/moderator')->assertForbidden();
        $this->withSession(['user_id' => $user->id])->get('/moderator')->assertForbidden();
        $this->withSession(['user_id' => $moderator->id])->get('/moderator')->assertOk();
        $this->withSession(['user_id' => $admin->id])->get('/moderator')->assertOk();
    }

    public function test_moderation_api_is_available_to_admins_and_moderators_only(): void
    {
        $user = $this->user('user');
        $moderator = $this->user('moderator');
        $video = UserVideo::query()->create([
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'на модерации',
            'image' => '/images/course-guitar.jpg',
        ]);
        $comment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Text',
            'target' => 'Course',
            'status' => 'ожидает',
        ]);

        $this->withSession(['user_id' => $user->id])
            ->patchJson("/api/videos/{$video->id}/status", ['status' => 'опубликовано'])
            ->assertForbidden();

        $this->withSession(['user_id' => $moderator->id])
            ->patchJson("/api/videos/{$video->id}/status", ['status' => 'опубликовано'])
            ->assertOk()
            ->assertJsonPath('video.status', 'опубликовано');

        $this->withSession(['user_id' => $moderator->id])
            ->patchJson("/api/comments/{$comment->id}/status", ['status' => 'одобрено'])
            ->assertOk()
            ->assertJsonPath('comment.status', 'одобрено');
    }

    public function test_lesson_progress_is_stored_per_user(): void
    {
        $firstUser = $this->user('user', 'first@example.com');
        $secondUser = $this->user('user', 'second@example.com');
        $course = Course::query()->create($this->coursePayload());
        $firstLesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));
        Lesson::query()->create($this->lessonPayload($course, 'lesson-2', 2));

        $this->withSession(['user_id' => $firstUser->id])
            ->patchJson("/api/lessons/{$firstLesson->id}/progress", ['completed' => true])
            ->assertOk()
            ->assertJsonPath('course.progress', 50);

        $this->withSession(['user_id' => $firstUser->id])
            ->getJson('/api/courses/T1')
            ->assertOk()
            ->assertJsonPath('course.progress', 50);

        $this->withSession(['user_id' => $secondUser->id])
            ->getJson('/api/courses/T1')
            ->assertOk()
            ->assertJsonPath('course.progress', 0);
    }

    public function test_course_and_lesson_comments_follow_access_rules(): void
    {
        $user = $this->user('user');
        $course = Course::query()->create($this->coursePayload());
        $lesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));

        $this->postJson('/api/comments', [
            'text' => 'Great course',
            'targetType' => 'course',
            'targetCode' => 'T1',
        ])->assertForbidden();

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/comments', [
                'text' => 'Great course',
                'targetType' => 'course',
                'targetCode' => 'T1',
            ])
            ->assertForbidden();

        CourseEnrollment::query()->create([
            'userId' => $user->id,
            'course_id' => $course->id,
            'startedAt' => now(),
        ]);

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/comments', [
                'text' => 'Great course',
                'targetType' => 'course',
                'targetCode' => 'T1',
            ])
            ->assertCreated()
            ->assertJsonPath('comment.status', 'ожидает')
            ->assertJsonPath('comment.author', 'User');

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/comments', [
                'text' => 'Great lesson',
                'targetType' => 'lesson',
                'targetCode' => 'lesson-1',
            ])
            ->assertForbidden();

        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $lesson->id,
            'completed' => true,
            'completedAt' => now(),
        ]);

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/comments', [
                'text' => 'Great lesson',
                'targetType' => 'lesson',
                'targetCode' => 'lesson-1',
            ])
            ->assertCreated()
            ->assertJsonPath('comment.targetType', 'lesson');
    }

    public function test_community_video_page_and_comments_work(): void
    {
        $user = $this->user('user');
        $video = UserVideo::query()->create([
            'userId' => $user->id,
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'опубликовано',
            'image' => '/images/course-guitar.jpg',
            'video' => '/videos/spatial.mp4',
        ]);
        PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Nice',
            'target' => 'Practice',
            'target_type' => 'video',
            'target_code' => (string) $video->id,
            'status' => 'одобрено',
        ]);

        $this->get("/community/videos/{$video->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('CommunityVideo')
                ->where('video.title', 'Practice')
                ->where('video.author', 'User')
                ->where('canComment', false)
                ->has('comments', 1)
            );

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/comments', [
                'text' => 'Great video',
                'targetType' => 'video',
                'targetCode' => (string) $video->id,
            ])
            ->assertCreated()
            ->assertJsonPath('comment.targetType', 'video')
            ->assertJsonPath('comment.targetUrl', "/community/videos/{$video->id}");
    }

    public function test_fake_course_progress_is_not_exposed_without_user_progress(): void
    {
        $course = Course::query()->create([
            ...$this->coursePayload(),
            'progress' => 87,
        ]);
        Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));

        $this->getJson('/api/courses/T1')
            ->assertOk()
            ->assertJsonPath('course.progress', 0);
    }

    public function test_lessons_require_authentication_to_start_course(): void
    {
        $user = $this->user('user');
        $course = Course::query()->create($this->coursePayload());
        Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));

        $this->get('/courses/T1/lessons/lesson-1')->assertRedirect('/login');
        $this->withSession(['user_id' => $user->id])->get('/courses/T1/lessons/lesson-1')->assertOk();
    }

    public function test_enroll_adds_course_to_profile_with_zero_progress_without_duplicates(): void
    {
        $user = $this->user('user');
        $course = Course::query()->create($this->coursePayload());
        Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));

        $this->postJson('/api/courses/T1/enroll')->assertForbidden();

        $this->withSession(['user_id' => $user->id])
            ->postJson('/api/courses/T1/enroll')
            ->assertCreated()
            ->assertJsonPath('course.progress', 0)
            ->assertJsonPath('lessonUrl', '/courses/T1/lessons/lesson-1');

        $this->withSession(['user_id' => $user->id])->postJson('/api/courses/T1/enroll')->assertCreated();

        $this->assertSame(1, CourseEnrollment::query()->where('userId', $user->id)->where('course_id', $course->id)->count());

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('courses', 1)
                ->where('courses.0.progress', 0)
            );
    }

    public function test_profile_only_shows_enrolled_courses(): void
    {
        $user = $this->user('user');
        $enrolled = Course::query()->create($this->coursePayload());
        $other = Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T2',
            'title' => 'Other Course',
        ]);
        Lesson::query()->create($this->lessonPayload($enrolled, 'lesson-1', 1));
        Lesson::query()->create($this->lessonPayload($other, 'lesson-2', 1));
        CourseEnrollment::query()->create([
            'userId' => $user->id,
            'course_id' => $enrolled->id,
            'startedAt' => now(),
        ]);

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('courses', 1)
                ->where('courses.0.id', 'T1')
            );
    }

    public function test_profile_recommendations_are_based_on_unenrolled_courses_with_reasons(): void
    {
        $user = $this->user('user');
        $user->update(['level' => 'Начинающий']);
        $guitar = Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);
        $user->instruments()->attach($guitar->id);

        $enrolled = Course::query()->create($this->coursePayload());
        $matching = Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T2',
            'title' => 'Matching Course',
        ]);
        $levelOnly = Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T3',
            'title' => 'Level Course',
            'instrument' => 'Фортепиано',
        ]);
        Course::query()->create([
            ...$this->coursePayload(),
            'code' => 'T4',
            'title' => 'Other Course',
            'instrument' => 'Вокал',
            'level' => 'Средний',
        ]);
        Lesson::query()->create($this->lessonPayload($enrolled, 'lesson-1', 1));
        Lesson::query()->create($this->lessonPayload($matching, 'lesson-2', 1));
        Lesson::query()->create($this->lessonPayload($levelOnly, 'lesson-3', 1));
        CourseEnrollment::query()->create([
            'userId' => $user->id,
            'course_id' => $enrolled->id,
            'startedAt' => now(),
        ]);

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('recommendations', 2)
                ->where('recommendations.0.id', 'T2')
                ->where('recommendations.0.reason', 'по инструменту и уровню')
                ->where('recommendations.1.id', 'T3')
                ->where('recommendations.1.reason', 'по уровню подготовки')
            );
    }

    public function test_profile_recommendations_fall_back_to_starter_courses_without_selected_instruments(): void
    {
        $user = $this->user('user');
        $course = Course::query()->create($this->coursePayload());
        Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('recommendations', 1)
                ->where('recommendations.0.reason', 'для уверенного старта')
            );
    }

    public function test_profile_completed_lessons_are_personal_and_sorted(): void
    {
        $user = $this->user('user');
        $otherUser = $this->user('user', 'other@example.com');
        $course = Course::query()->create($this->coursePayload());
        $firstLesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));
        $secondLesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-2', 2));
        $thirdLesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-3', 3));

        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $firstLesson->id,
            'completed' => true,
            'completedAt' => now()->subDay(),
        ]);
        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $secondLesson->id,
            'completed' => true,
            'completedAt' => now(),
        ]);
        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $thirdLesson->id,
            'completed' => false,
            'completedAt' => null,
        ]);
        LessonProgress::query()->create([
            'userId' => $otherUser->id,
            'lesson_id' => $thirdLesson->id,
            'completed' => true,
            'completedAt' => now(),
        ]);

        $this->withSession(['user_id' => $user->id])
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('completedLessons', 2)
                ->where('completedLessons.0.title', 'Lesson 2')
                ->where('completedLessons.1.title', 'Lesson 1')
            );
    }

    public function test_profile_update_changes_user_and_selected_instruments(): void
    {
        $user = $this->user('user');
        Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);
        Instrument::query()->create([
            'slug' => 'piano',
            'name' => 'Фортепиано',
            'image' => '/images/course-piano.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);

        $this->patchJson('/api/profile', [])->assertForbidden();

        $this->withSession(['user_id' => $user->id])
            ->patchJson('/api/profile', [
                'name' => 'Валерий',
                'email' => 'valery@example.com',
                'level' => 'Средний',
                'avatar' => '/images/course-vocal.jpg',
                'instrumentIds' => ['guitar', 'piano'],
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Валерий')
            ->assertJsonPath('user.level', 'Средний')
            ->assertJsonCount(2, 'instruments');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Валерий',
            'instrument' => 'Гитара',
        ]);
    }

    public function test_profile_avatar_upload_requires_auth_and_image_file(): void
    {
        Storage::fake('public');
        $user = $this->user('user');

        $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->withSession(['user_id' => $user->id])
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->create('avatar.txt', 1, 'text/plain'),
            ], ['Accept' => 'application/json'])
            ->assertJsonValidationErrors('avatar');

        $response = $this->withSession(['user_id' => $user->id])
            ->post('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('avatar.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $avatar = $response->json('avatar');

        $this->assertStringStartsWith('/storage/avatars/', $avatar);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $avatar));
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'avatar' => $avatar,
        ]);
    }

    public function test_user_video_upload_requires_auth_and_video_file(): void
    {
        Storage::fake('public');
        $user = $this->user('user');

        $payload = [
            'title' => 'Practice video',
            'description' => 'Homework',
            'instrument' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'video' => UploadedFile::fake()->create('practice.mp4', 10, 'video/mp4'),
        ];

        $this->post('/api/videos', $payload, ['Accept' => 'application/json'])->assertForbidden();

        $this->withSession(['user_id' => $user->id])
            ->post('/api/videos', [
                ...$payload,
                'video' => UploadedFile::fake()->create('practice.txt', 1, 'text/plain'),
            ], ['Accept' => 'application/json'])
            ->assertJsonValidationErrors('video');

        $response = $this->withSession(['user_id' => $user->id])
            ->post('/api/videos', $payload, ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('video.status', 'на модерации')
            ->assertJsonPath('video.author', 'User');

        $videoPath = $response->json('video.video');

        $this->assertStringStartsWith('/storage/videos/community/', $videoPath);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $videoPath));
        $this->assertDatabaseHas('user_videos', [
            'userId' => $user->id,
            'title' => 'Practice video',
            'status' => 'на модерации',
            'video' => $videoPath,
        ]);
    }

    public function test_community_video_payload_contains_author(): void
    {
        $user = $this->user('user');
        UserVideo::query()->create([
            'title' => 'Legacy',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'опубликовано',
            'image' => '/images/course-guitar.jpg',
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);
        UserVideo::query()->create([
            'userId' => $user->id,
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'опубликовано',
            'image' => '/images/course-guitar.jpg',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->get('/community')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('MyVideos')
                ->has('userVideos', 2)
            )
            ->assertSee('User')
            ->assertSee('PlayNote');
    }

    public function test_instrument_course_count_is_computed_from_courses(): void
    {
        Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 99,
        ]);
        Course::query()->create($this->coursePayload());

        $this->get('/instruments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Instruments')
                ->where('instruments.0.courseCount', 1)
            );
    }

    public function test_theory_instrument_counts_generic_theory_course(): void
    {
        Instrument::query()->create([
            'slug' => 'theory',
            'name' => 'Теория',
            'image' => '/images/course-theory.jpg',
            'description' => 'Instrument',
            'course_count' => 0,
        ]);
        Course::query()->create([
            ...$this->coursePayload(),
            'instrument' => 'Любой инструмент',
        ]);

        $this->get('/instruments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Instruments')
                ->where('instruments.0.courseCount', 1)
            );
    }

    public function test_user_delete_cascades_owned_and_personal_records(): void
    {
        $user = $this->user('teacher', 'cascade-teacher@example.com');
        $instrument = Instrument::query()->create([
            'slug' => 'guitar',
            'name' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'description' => 'Instrument',
            'course_count' => 1,
        ]);
        $course = Course::query()->create([
            ...$this->coursePayload(),
            'user_id' => $user->id,
        ]);
        $lesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));
        $video = UserVideo::query()->create([
            'userId' => $user->id,
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'опубликовано',
            'image' => '/images/course-guitar.jpg',
        ]);
        $comment = PlatformComment::query()->create([
            'userId' => $user->id,
            'author' => 'Teacher',
            'text' => 'Text',
            'target' => 'Practice',
            'target_type' => 'video',
            'target_code' => (string) $video->id,
            'status' => 'одобрено',
        ]);
        CourseEnrollment::query()->create([
            'userId' => $user->id,
            'course_id' => $course->id,
            'startedAt' => now(),
        ]);
        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $lesson->id,
            'completed' => true,
            'completedAt' => now(),
        ]);
        CourseRequest::query()->create([
            'userId' => $user->id,
            'name' => 'Teacher',
            'email' => 'cascade-teacher@example.com',
            'instrument' => 'Гитара',
            'level' => 'Начинающий',
            'goal' => 'Играть песни',
        ]);
        $user->instruments()->attach($instrument->id);

        $user->delete();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
        $this->assertDatabaseMissing('course_enrollments', ['userId' => $user->id]);
        $this->assertDatabaseMissing('lesson_progress', ['userId' => $user->id]);
        $this->assertDatabaseMissing('user_instruments', ['userId' => $user->id]);
        $this->assertDatabaseMissing('user_videos', ['id' => $video->id]);
        $this->assertDatabaseMissing('platform_comments', ['id' => $comment->id]);
        $this->assertDatabaseMissing('course_requests', ['userId' => $user->id]);
    }

    public function test_course_delete_cascades_lessons_progress_enrollments_and_comments(): void
    {
        $user = $this->user('user', 'course-cascade@example.com');
        $course = Course::query()->create($this->coursePayload());
        $lesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));
        $courseComment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Course comment',
            'target' => 'Test Course',
            'target_type' => 'course',
            'target_code' => $course->code,
            'status' => 'одобрено',
        ]);
        $lessonComment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Lesson comment',
            'target' => 'Lesson 1',
            'target_type' => 'lesson',
            'target_code' => $lesson->code,
            'status' => 'одобрено',
        ]);
        CourseEnrollment::query()->create([
            'userId' => $user->id,
            'course_id' => $course->id,
            'startedAt' => now(),
        ]);
        LessonProgress::query()->create([
            'userId' => $user->id,
            'lesson_id' => $lesson->id,
            'completed' => true,
            'completedAt' => now(),
        ]);

        $course->delete();

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
        $this->assertDatabaseMissing('course_enrollments', ['course_id' => $course->id]);
        $this->assertDatabaseMissing('lesson_progress', ['lesson_id' => $lesson->id]);
        $this->assertDatabaseMissing('platform_comments', ['id' => $courseComment->id]);
        $this->assertDatabaseMissing('platform_comments', ['id' => $lessonComment->id]);
    }

    public function test_legacy_comment_targets_populate_explicit_foreign_keys(): void
    {
        $course = Course::query()->create($this->coursePayload());
        $lesson = Lesson::query()->create($this->lessonPayload($course, 'lesson-1', 1));
        $video = UserVideo::query()->create([
            'title' => 'Practice',
            'description' => 'Video',
            'instrument' => 'Гитара',
            'status' => 'опубликовано',
            'image' => '/images/course-guitar.jpg',
        ]);

        $courseComment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Course comment',
            'target' => 'Test Course',
            'target_type' => 'course',
            'target_code' => $course->code,
            'status' => 'одобрено',
        ]);
        $lessonComment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Lesson comment',
            'target' => 'Lesson 1',
            'target_type' => 'lesson',
            'target_code' => $lesson->code,
            'status' => 'одобрено',
        ]);
        $videoComment = PlatformComment::query()->create([
            'author' => 'Student',
            'text' => 'Video comment',
            'target' => 'Practice',
            'target_type' => 'video',
            'target_code' => (string) $video->id,
            'status' => 'одобрено',
        ]);

        $this->assertDatabaseHas('platform_comments', ['id' => $courseComment->id, 'course_id' => $course->id]);
        $this->assertDatabaseHas('platform_comments', ['id' => $lessonComment->id, 'lesson_id' => $lesson->id]);
        $this->assertDatabaseHas('platform_comments', ['id' => $videoComment->id, 'user_video_id' => $video->id]);
    }

    public function test_generic_course_and_other_course_request_allow_nullable_instrument_relation(): void
    {
        $course = Course::query()->create([
            ...$this->coursePayload(),
            'instrument' => 'Любой инструмент',
        ]);

        $this->postJson('/course-requests', [
            'name' => 'Student',
            'email' => 'student@example.com',
            'instrument' => 'Другое',
            'level' => 'Новичок',
            'goal' => 'Играть песни',
            'privacyConsent' => true,
        ])->assertOk();

        $this->assertDatabaseHas('courses', ['id' => $course->id, 'instrument_id' => null]);
        $this->assertDatabaseHas('course_requests', ['email' => 'student@example.com', 'instrument' => 'Другое', 'instrument_id' => null]);
    }

    private function user(string $role, string $email = 'student@example.com'): User
    {
        return User::query()->create([
            'unionId' => $role.'-'.$email,
            'name' => ucfirst($role),
            'email' => $email,
            'role' => $role,
        ]);
    }

    private function coursePayload(): array
    {
        return [
            'code' => 'T1',
            'title' => 'Test Course',
            'author' => 'Teacher',
            'category' => 'Основы',
            'instrument' => 'Гитара',
            'image' => '/images/course-guitar.jpg',
            'tagline' => 'Tagline',
            'short_description' => 'Short',
            'description' => ['Description'],
            'features' => ['Feature'],
            'outcomes' => ['Outcome'],
            'lessons' => '2 урока',
            'lesson_count' => 2,
            'level' => 'Начинающий',
            'duration' => '2 недели',
            'duration_weeks' => 2,
            'progress' => 0,
            'video' => '/videos/spatial.mp4',
        ];
    }

    private function courseFrontendPayload(string $code = 'T1'): array
    {
        return [
            'id' => $code,
            'title' => 'Test Course',
            'author' => 'Teacher',
            'category' => 'Основы',
            'instrument' => 'Гитара',
            'img' => '/images/course-guitar.jpg',
            'tagline' => 'Tagline',
            'shortDescription' => 'Short',
            'description' => ['Description'],
            'features' => ['Feature'],
            'outcomes' => ['Outcome'],
            'lessons' => '1 урок',
            'lessonCount' => 1,
            'level' => 'Начинающий',
            'progress' => 0,
            'video' => '/videos/spatial.mp4',
            'lessonList' => [[
                'id' => 'lesson-1',
                'title' => 'Lesson 1',
                'description' => 'Lesson description',
                'duration' => '10 мин',
                'video' => '/videos/spatial.mp4',
            ]],
        ];
    }

    private function lessonPayload(Course $course, string $code, int $position): array
    {
        return [
            'course_id' => $course->id,
            'code' => $code,
            'title' => 'Lesson '.$position,
            'description' => 'Lesson description',
            'duration' => '10 мин',
            'video' => '/videos/spatial.mp4',
            'position' => $position,
        ];
    }

    private function createVerificationCode(string $email): void
    {
        EmailVerificationCode::query()->create([
            'email' => mb_strtolower($email),
            'purpose' => 'registration',
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(15),
        ]);
    }
}
