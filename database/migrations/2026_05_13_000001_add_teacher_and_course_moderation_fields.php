<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql' && Schema::hasTable('users')) {
            DB::statement("ALTER TABLE users MODIFY role ENUM('user', 'admin', 'moderator', 'teacher') NOT NULL DEFAULT 'user'");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('teacher_status', ['ожидает', 'одобрен', 'отклонён'])->nullable()->after('role');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['черновик', 'на модерации', 'опубликовано', 'отклонено'])->default('опубликовано')->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('teacher_status');
        });

        if (DB::getDriverName() === 'mysql' && Schema::hasTable('users')) {
            DB::statement("ALTER TABLE users MODIFY role ENUM('user', 'admin', 'moderator') NOT NULL DEFAULT 'user'");
        }
    }
};
