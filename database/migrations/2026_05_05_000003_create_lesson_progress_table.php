<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->boolean('completed')->default(false);
            $table->timestamp('completedAt')->nullable();
            $table->timestamps();

            $table->unique(['userId', 'lesson_id']);
            $table->index('userId');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};
