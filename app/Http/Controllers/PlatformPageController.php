<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Instrument;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\PlatformComment;
use App\Models\User;
use App\Models\UserVideo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformPageController extends Controller
{
    public function home(Request $request): Response
    {
        return Inertia::render('Home', [
            'courses' => $this->coursesFor($request),
        ]);
    }

    public function courses(Request $request): Response
    {
        return Inertia::render('CoursesCatalog', [
            'courses' => $this->coursesFor($request),
        ]);
    }

    public function courseDetail(Request $request, string $courseId): Response
    {
        $user = $this->user($request);
        $course = Course::query()
            ->with(['lessonList', 'owner'])
            ->where('code', $courseId)
            ->firstOrFail();

        abort_if(! $this->canViewCourse($course, $user), 404, 'Курс не найден.');

        return Inertia::render('CourseDetail', [
            'course' => $course->toFrontend(true, $user?->id),
            'relatedCourses' => $this->coursesFor($request)
                ->reject(fn (array $item) => $item['id'] === $courseId)
                ->values()
                ->all(),
            'comments' => PlatformComment::query()
                ->with(['course', 'lesson.course', 'video'])
                ->where('status', 'одобрено')
                ->where('course_id', $course->id)
                ->latest()
                ->get()
                ->map(fn (PlatformComment $comment) => $comment->toFrontend()),
            'canComment' => $this->isEnrolled($request, $course),
        ]);
    }

    public function lesson(Request $request, string $courseId, string $lessonId): Response
    {
        $user = $this->user($request);
        $course = Course::query()
            ->with(['lessonList', 'owner'])
            ->where('code', $courseId)
            ->firstOrFail();

        abort_if(! $this->canViewCourse($course, $user), 404, 'Курс не найден.');

        $lesson = $course->lessonList->firstWhere('code', $lessonId) ?? $course->lessonList->first();

        abort_if(! $lesson instanceof Lesson, 404, 'Урок не найден.');

        return Inertia::render('LessonPage', [
            'course' => $course->toFrontend(true, $user?->id),
            'lessonId' => $lesson->code,
            'comments' => PlatformComment::query()
                ->with(['course', 'lesson.course', 'video'])
                ->where('lesson_id', $lesson->id)
                ->where('status', 'одобрено')
                ->latest()
                ->get()
                ->map(fn (PlatformComment $comment) => $comment->toFrontend()),
            'canComment' => $this->isLessonCompleted($request, $lesson),
        ]);
    }

    public function instruments(): Response
    {
        return Inertia::render('Instruments', [
            'instruments' => $this->instrumentsForFrontend(),
        ]);
    }

    public function profile(Request $request): Response
    {
        $user = $this->user($request);
        abort_if(! $user, 403, 'Нужно войти в аккаунт.');
        $selectedInstruments = $user->instruments()
            ->orderBy('instruments.id')
            ->get();
        $enrolledCourseIds = $user->enrollments()
            ->pluck('course_id')
            ->all();
        $profileCourses = Course::query()
            ->with('lessonList')
            ->where('status', 'опубликовано')
            ->whereIn('id', $enrolledCourseIds)
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => $course->toFrontend(true, $user->id));

        return Inertia::render('Dashboard', [
            'courses' => $profileCourses->all(),
            'instruments' => $this->instrumentsForFrontend(),
            'recommendations' => $this->recommendationsFor($user, $selectedInstruments, $enrolledCourseIds),
            'completedLessons' => $this->completedLessonsFor($user),
            'selectedInstruments' => $selectedInstruments
                ->map(fn (Instrument $instrument) => $instrument->toFrontend()),
            'userVideos' => UserVideo::query()
                ->when($user, fn ($query) => $query->where('userId', $user->id))
                ->with('user')
                ->latest()
                ->get()
                ->map(fn (UserVideo $video) => $video->toFrontend()),
        ]);
    }

    public function community(): Response
    {
        return Inertia::render('MyVideos', [
            'instruments' => $this->instrumentsForFrontend(),
            'userVideos' => UserVideo::query()
                ->with('user')
                ->latest()
                ->get()
                ->map(fn (UserVideo $video) => $video->toFrontend()),
        ]);
    }

    public function communityVideo(Request $request, int $video): Response
    {
        $userVideo = UserVideo::query()
            ->with('user')
            ->where('status', 'опубликовано')
            ->findOrFail($video);

        return Inertia::render('CommunityVideo', [
            'video' => $userVideo->toFrontend(),
            'comments' => PlatformComment::query()
                ->with(['course', 'lesson.course', 'video'])
                ->where('status', 'одобрено')
                ->where('user_video_id', $userVideo->id)
                ->latest()
                ->get()
                ->map(fn (PlatformComment $comment) => $comment->toFrontend()),
            'canComment' => $this->userId($request) !== null,
        ]);
    }

    public function moderator(): Response
    {
        return Inertia::render('Moderator', [
            'comments' => PlatformComment::query()
                ->with(['course', 'lesson.course', 'video'])
                ->latest()
                ->get()
                ->map(fn (PlatformComment $comment) => $comment->toFrontend()),
            'userVideos' => UserVideo::query()
                ->with('user')
                ->latest()
                ->get()
                ->map(fn (UserVideo $video) => $video->toFrontend()),
            'teacherApplications' => User::query()
                ->with('instruments')
                ->where('role', 'teacher')
                ->latest()
                ->get()
                ->map(fn (User $user) => $this->teacherPayload($user)),
            'courseSubmissions' => Course::query()
                ->with(['lessonList', 'owner'])
                ->whereNotNull('user_id')
                ->latest()
                ->get()
                ->map(fn (Course $course) => $course->toFrontend()),
        ]);
    }

    public function admin(Request $request): Response
    {
        $courses = $this->allCoursesFor($request);
        $instruments = $this->instrumentsForFrontend();

        return Inertia::render('Admin', [
            'adminStats' => [
                ['Пользователи', (string) User::query()->count()],
                ['Курсы', (string) $courses->count()],
                ['Инструменты', (string) $instruments->count()],
            ],
            'courses' => $courses->all(),
            'instruments' => $instruments,
            'users' => User::query()
                ->with('instruments')
                ->orderBy('id')
                ->get()
                ->map(fn (User $user) => $this->adminUserPayload($user)),
            'workspace' => 'admin',
        ]);
    }

    public function teacher(Request $request): Response
    {
        $user = $this->user($request);
        abort_if(! $user || $user->role !== 'teacher', 403, 'Доступ запрещён.');

        if ($user->teacher_status !== 'одобрен') {
            return Inertia::render('TeacherStatus', [
                'status' => $user->teacher_status ?? 'ожидает',
                'instruments' => $user->instruments()
                    ->orderBy('instruments.id')
                    ->get()
                    ->map(fn (Instrument $instrument) => $instrument->toFrontend()),
            ]);
        }

        $courses = Course::query()
            ->with(['lessonList', 'owner'])
            ->where('user_id', $user->id)
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => $course->toFrontend(true, $user->id));

        return Inertia::render('Admin', [
            'adminStats' => [
                ['Мои курсы', (string) $courses->count()],
                ['На модерации', (string) $courses->where('status', 'на модерации')->count()],
                ['Опубликовано', (string) $courses->where('status', 'опубликовано')->count()],
            ],
            'courses' => $courses->values()->all(),
            'instruments' => $this->instrumentsForFrontend(),
            'users' => [],
            'workspace' => 'teacher',
        ]);
    }

    public function courseEditor(Request $request, ?string $courseId = null): Response
    {
        $user = $this->user($request);
        abort_if(! $user, 403, 'Нужно войти в аккаунт.');

        $course = $courseId
            ? Course::query()->with(['lessonList', 'owner'])->where('code', $courseId)->firstOrFail()
            : null;

        if ($user->role === 'teacher') {
            abort_if($user->teacher_status !== 'одобрен', 403, 'Доступ запрещён.');
            abort_if($course && (int) $course->user_id !== (int) $user->id, 403, 'Доступ запрещён.');
        }

        return Inertia::render('CourseEditor', [
            'course' => $course?->toFrontend(true, $user->id),
            'instruments' => $this->instrumentsForFrontend(),
            'workspace' => $user->role === 'teacher' ? 'teacher' : 'admin',
        ]);
    }

    public function register(): Response
    {
        return Inertia::render('Register', [
            'instruments' => $this->instrumentsForFrontend(),
        ]);
    }

    private function user(Request $request): ?User
    {
        $userId = $request->session()->get('user_id');

        return $userId ? User::query()->find($userId) : null;
    }

    private function userId(Request $request): ?int
    {
        return $this->user($request)?->id;
    }

    private function coursesFor(Request $request)
    {
        $userId = $this->userId($request);

        return Course::query()
            ->with(['lessonList', 'owner'])
            ->where('status', 'опубликовано')
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => $course->toFrontend(true, $userId));
    }

    private function allCoursesFor(Request $request)
    {
        $userId = $this->userId($request);

        return Course::query()
            ->with(['lessonList', 'owner'])
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => $course->toFrontend(true, $userId));
    }

    private function recommendationsFor(User $user, $selectedInstruments, array $enrolledCourseIds): array
    {
        $instrumentIds = $selectedInstruments->pluck('id')->all();

        return Course::query()
            ->with('lessonList')
            ->where('status', 'опубликовано')
            ->whereNotIn('id', $enrolledCourseIds)
            ->get()
            ->sort(function (Course $first, Course $second) use ($user, $instrumentIds): int {
                $scoreComparison = $this->recommendationScore($second, $user, $instrumentIds) <=> $this->recommendationScore($first, $user, $instrumentIds);

                return $scoreComparison !== 0 ? $scoreComparison : strcmp($first->code, $second->code);
            })
            ->filter(fn (Course $course) => $this->recommendationScore($course, $user, $instrumentIds) > 0)
            ->take(6)
            ->map(function (Course $course) use ($user, $instrumentIds): array {
                return [
                    ...$course->toFrontend(true, $user->id),
                    'reason' => $this->recommendationReason($course, $user, $instrumentIds),
                ];
            })
            ->values()
            ->all();
    }

    private function recommendationScore(Course $course, User $user, array $instrumentIds): int
    {
        $score = 0;

        if ($course->instrument_id !== null && in_array($course->instrument_id, $instrumentIds, true)) {
            $score += 4;
        }

        if ($user->level && $course->level === $user->level) {
            $score += 2;
        }

        if ($course->level === 'Начинающий' || $course->instrument === 'Любой инструмент') {
            $score += 1;
        }

        return $score;
    }

    private function recommendationReason(Course $course, User $user, array $instrumentIds): string
    {
        $levelMatches = $user->level && $course->level === $user->level;

        $instrumentMatches = $course->instrument_id !== null && in_array($course->instrument_id, $instrumentIds, true);

        if ($instrumentMatches && $levelMatches) {
            return 'по инструменту и уровню';
        }

        if ($instrumentMatches) {
            return 'по выбранному инструменту';
        }

        if ($levelMatches) {
            return 'по уровню подготовки';
        }

        return 'для уверенного старта';
    }

    private function completedLessonsFor(User $user): array
    {
        return LessonProgress::query()
            ->with('lesson.course')
            ->where('userId', $user->id)
            ->where('completed', true)
            ->orderByDesc('completedAt')
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (LessonProgress $progress): array {
                $lesson = $progress->lesson;
                $course = $lesson?->course;

                return [
                    'id' => ($course?->code ?? 'course').'-'.($lesson?->code ?? $progress->id),
                    'databaseId' => $lesson?->id,
                    'title' => $lesson?->title ?? 'Урок',
                    'courseId' => $course?->code,
                    'courseTitle' => $course?->title ?? 'Курс',
                    'lessonId' => $lesson?->code,
                    'completedAt' => $progress->completedAt?->toJSON(),
                ];
            })
            ->values()
            ->all();
    }

    private function instrumentsForFrontend()
    {
        return Instrument::query()
            ->orderBy('id')
            ->get()
            ->map(fn (Instrument $instrument) => $instrument->toFrontend());
    }

    private function isEnrolled(Request $request, Course $course): bool
    {
        $userId = $this->userId($request);

        if (! $userId) {
            return false;
        }

        return CourseEnrollment::query()
            ->where('userId', $userId)
            ->where('course_id', $course->id)
            ->exists();
    }

    private function isLessonCompleted(Request $request, Lesson $lesson): bool
    {
        $userId = $this->userId($request);

        if (! $userId) {
            return false;
        }

        return LessonProgress::query()
            ->where('userId', $userId)
            ->where('lesson_id', $lesson->id)
            ->where('completed', true)
            ->exists();
    }

    private function canViewCourse(Course $course, ?User $user): bool
    {
        if ($course->status === 'опубликовано') {
            return true;
        }

        if (! $user) {
            return false;
        }

        if (in_array($user->role, ['admin', 'moderator'], true)) {
            return true;
        }

        return $user->role === 'teacher' && (int) $course->user_id === (int) $user->id;
    }

    private function teacherPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->teacher_status ?? 'ожидает',
            'instrument' => $user->instrument,
            'instrumentIds' => $user->instruments->pluck('slug')->values()->all(),
            'instruments' => $user->instruments->pluck('name')->values()->all(),
        ];
    }

    private function adminUserPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'teacherStatus' => $user->teacher_status,
            'isBanned' => $user->is_banned,
            'instrument' => $user->instrument,
            'level' => $user->level,
            'instrumentIds' => $user->instruments->pluck('slug')->values()->all(),
            'createdAt' => $user->createdAt?->toJSON(),
            'lastSignInAt' => $user->lastSignInAt?->toJSON(),
        ];
    }
}
