<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instruments', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('image');
            $table->text('description');
            $table->unsignedInteger('course_count')->default(0);
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->string('title');
            $table->string('author');
            $table->string('category');
            $table->string('instrument');
            $table->string('image');
            $table->string('tagline');
            $table->text('short_description');
            $table->json('description');
            $table->json('features');
            $table->json('outcomes');
            $table->string('lessons');
            $table->unsignedInteger('lesson_count');
            $table->string('level');
            $table->string('duration');
            $table->unsignedInteger('duration_weeks');
            $table->unsignedInteger('progress')->default(0);
            $table->string('video');
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->string('title');
            $table->text('description');
            $table->string('duration');
            $table->string('video');
            $table->boolean('completed')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['course_id', 'code']);
        });

        Schema::create('user_videos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('instrument');
            $table->enum('status', ['опубликовано', 'на модерации', 'отклонено'])->default('на модерации');
            $table->string('image');
            $table->string('video')->nullable();
            $table->timestamps();

            $table->index('userId');
        });

        Schema::create('platform_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId')->nullable();
            $table->string('author');
            $table->text('text');
            $table->string('target');
            $table->enum('status', ['ожидает', 'одобрено', 'отклонено'])->default('ожидает');
            $table->timestamps();

            $table->index('userId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_comments');
        Schema::dropIfExists('user_videos');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('instruments');
    }
};
