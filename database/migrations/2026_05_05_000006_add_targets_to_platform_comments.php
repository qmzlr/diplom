<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_comments', function (Blueprint $table) {
            $table->string('target_type', 32)->default('course')->after('target');
            $table->string('target_code', 128)->nullable()->after('target_type');
        });
    }

    public function down(): void
    {
        Schema::table('platform_comments', function (Blueprint $table) {
            $table->dropColumn(['target_type', 'target_code']);
        });
    }
};
