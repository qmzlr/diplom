<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId')->nullable();
            $table->string('name');
            $table->string('email', 320);
            $table->string('instrument', 128);
            $table->string('level', 64);
            $table->string('goal');
            $table->enum('status', ['pending', 'processed', 'closed'])->default('pending');
            $table->timestamp('createdAt')->useCurrent();

            $table->index('userId');
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_requests');
    }
};
