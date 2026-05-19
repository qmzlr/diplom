<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addInstrumentColumns();
        $this->addCommentTargetColumns();
        $this->backfillInstrumentIds();
        $this->backfillCommentTargets();
        $this->addUserForeignKeys();
        $this->updateCourseOwnerForeignKey();
        $this->addCommentIndexes();
    }

    public function down(): void
    {
        $this->dropCommentIndexes();
        $this->dropUserForeignKeys();
        $this->revertCourseOwnerForeignKey();

        Schema::table('platform_comments', function (Blueprint $table) {
            foreach (['course_id', 'lesson_id', 'user_video_id'] as $column) {
                if (Schema::hasColumn('platform_comments', $column)) {
                    $table->dropConstrainedForeignId($column);
                }
            }
        });

        foreach (['courses', 'user_videos', 'course_requests'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'instrument_id')) {
                    $table->dropConstrainedForeignId('instrument_id');
                }
            });
        }
    }

    private function addInstrumentColumns(): void
    {
        foreach (['courses', 'user_videos', 'course_requests'] as $tableName) {
            if (Schema::hasColumn($tableName, 'instrument_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table): void {
                $table->foreignId('instrument_id')
                    ->nullable()
                    ->after('instrument')
                    ->constrained('instruments')
                    ->nullOnDelete();
            });
        }
    }

    private function addCommentTargetColumns(): void
    {
        Schema::table('platform_comments', function (Blueprint $table): void {
            if (! Schema::hasColumn('platform_comments', 'course_id')) {
                $table->foreignId('course_id')->nullable()->after('target_code')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('platform_comments', 'lesson_id')) {
                $table->foreignId('lesson_id')->nullable()->after('course_id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('platform_comments', 'user_video_id')) {
                $table->foreignId('user_video_id')->nullable()->after('lesson_id')->constrained('user_videos')->cascadeOnDelete();
            }
        });
    }

    private function backfillInstrumentIds(): void
    {
        if ($this->driver() === 'sqlite') {
            foreach (['courses', 'user_videos', 'course_requests'] as $tableName) {
                DB::statement("
                    UPDATE {$tableName}
                    SET instrument_id = (
                        SELECT instruments.id
                        FROM instruments
                        WHERE instruments.name = {$tableName}.instrument
                        LIMIT 1
                    )
                    WHERE instrument_id IS NULL
                ");
            }

            return;
        }

        foreach (['courses', 'user_videos', 'course_requests'] as $tableName) {
            DB::statement("
                UPDATE {$tableName}
                JOIN instruments ON instruments.name = {$tableName}.instrument
                SET {$tableName}.instrument_id = instruments.id
                WHERE {$tableName}.instrument_id IS NULL
            ");
        }
    }

    private function backfillCommentTargets(): void
    {
        if ($this->driver() === 'sqlite') {
            DB::statement("
                UPDATE platform_comments
                SET course_id = (
                    SELECT courses.id
                    FROM courses
                    WHERE courses.code = platform_comments.target_code
                    LIMIT 1
                )
                WHERE target_type = 'course' AND course_id IS NULL
            ");

            DB::statement("
                UPDATE platform_comments
                SET lesson_id = (
                    SELECT lessons.id
                    FROM lessons
                    WHERE lessons.code = platform_comments.target_code
                    LIMIT 1
                )
                WHERE target_type = 'lesson' AND lesson_id IS NULL
            ");

            DB::statement("
                UPDATE platform_comments
                SET user_video_id = CAST(target_code AS INTEGER)
                WHERE target_type = 'video'
                    AND user_video_id IS NULL
                    AND EXISTS (
                        SELECT 1
                        FROM user_videos
                        WHERE user_videos.id = CAST(platform_comments.target_code AS INTEGER)
                    )
            ");

            return;
        }

        DB::statement("
            UPDATE platform_comments
            JOIN courses ON courses.code = platform_comments.target_code
            SET platform_comments.course_id = courses.id
            WHERE platform_comments.target_type = 'course'
                AND platform_comments.course_id IS NULL
        ");

        DB::statement("
            UPDATE platform_comments
            JOIN lessons ON lessons.code = platform_comments.target_code
            SET platform_comments.lesson_id = lessons.id
            WHERE platform_comments.target_type = 'lesson'
                AND platform_comments.lesson_id IS NULL
        ");

        DB::statement("
            UPDATE platform_comments
            JOIN user_videos ON CAST(user_videos.id AS CHAR) = platform_comments.target_code
            SET platform_comments.user_video_id = user_videos.id
            WHERE platform_comments.target_type = 'video'
                AND platform_comments.user_video_id IS NULL
        ");
    }

    private function addUserForeignKeys(): void
    {
        if ($this->driver() === 'sqlite') {
            return;
        }

        $foreignKeys = [
            'course_requests' => 'course_requests_userid_foreign',
            'course_enrollments' => 'course_enrollments_userid_foreign',
            'lesson_progress' => 'lesson_progress_userid_foreign',
            'user_instruments' => 'user_instruments_userid_foreign',
            'user_videos' => 'user_videos_userid_foreign',
            'platform_comments' => 'platform_comments_userid_foreign',
        ];

        foreach ($foreignKeys as $tableName => $constraintName) {
            if ($this->foreignKeyExists($tableName, $constraintName)) {
                continue;
            }

            DB::statement("
                ALTER TABLE {$tableName}
                ADD CONSTRAINT {$constraintName}
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            ");
        }
    }

    private function updateCourseOwnerForeignKey(): void
    {
        if ($this->driver() === 'sqlite') {
            return;
        }

        if ($this->foreignKeyExists('courses', 'courses_user_id_foreign')) {
            DB::statement('ALTER TABLE courses DROP FOREIGN KEY courses_user_id_foreign');
        }

        DB::statement('
            ALTER TABLE courses
            ADD CONSTRAINT courses_user_id_foreign
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ');
    }

    private function addCommentIndexes(): void
    {
        $indexes = [
            'platform_comments_status_course_id_index' => ['status', 'course_id'],
            'platform_comments_status_lesson_id_index' => ['status', 'lesson_id'],
            'platform_comments_status_user_video_id_index' => ['status', 'user_video_id'],
        ];

        foreach ($indexes as $indexName => $columns) {
            if ($this->indexExists('platform_comments', $indexName)) {
                continue;
            }

            Schema::table('platform_comments', function (Blueprint $table) use ($columns, $indexName): void {
                $table->index($columns, $indexName);
            });
        }
    }

    private function dropUserForeignKeys(): void
    {
        if ($this->driver() === 'sqlite') {
            return;
        }

        foreach ([
            'course_requests' => 'course_requests_userid_foreign',
            'course_enrollments' => 'course_enrollments_userid_foreign',
            'lesson_progress' => 'lesson_progress_userid_foreign',
            'user_instruments' => 'user_instruments_userid_foreign',
            'user_videos' => 'user_videos_userid_foreign',
            'platform_comments' => 'platform_comments_userid_foreign',
        ] as $tableName => $constraintName) {
            if ($this->foreignKeyExists($tableName, $constraintName)) {
                DB::statement("ALTER TABLE {$tableName} DROP FOREIGN KEY {$constraintName}");
            }
        }
    }

    private function revertCourseOwnerForeignKey(): void
    {
        if ($this->driver() === 'sqlite') {
            return;
        }

        if ($this->foreignKeyExists('courses', 'courses_user_id_foreign')) {
            DB::statement('ALTER TABLE courses DROP FOREIGN KEY courses_user_id_foreign');
        }

        DB::statement('
            ALTER TABLE courses
            ADD CONSTRAINT courses_user_id_foreign
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ');
    }

    private function dropCommentIndexes(): void
    {
        foreach ([
            'platform_comments_status_course_id_index',
            'platform_comments_status_lesson_id_index',
            'platform_comments_status_user_video_id_index',
        ] as $indexName) {
            if (! $this->indexExists('platform_comments', $indexName)) {
                continue;
            }

            Schema::table('platform_comments', function (Blueprint $table) use ($indexName): void {
                $table->dropIndex($indexName);
            });
        }
    }

    private function foreignKeyExists(string $tableName, string $constraintName): bool
    {
        if ($this->driver() === 'sqlite') {
            return false;
        }

        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('CONSTRAINT_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', $tableName)
            ->where('CONSTRAINT_NAME', $constraintName)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->exists();
    }

    private function indexExists(string $tableName, string $indexName): bool
    {
        if ($this->driver() === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$tableName}')");

            foreach ($indexes as $index) {
                if (($index->name ?? null) === $indexName) {
                    return true;
                }
            }

            return false;
        }

        return DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', $tableName)
            ->where('INDEX_NAME', $indexName)
            ->exists();
    }

    private function driver(): string
    {
        return DB::getDriverName();
    }
};
