<?php

use App\Models\Course;
use App\Models\Instrument;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->timestamp('startedAt')->useCurrent();
            $table->timestamps();

            $table->unique(['userId', 'course_id']);
            $table->index('userId');
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('user_instruments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->foreignId('instrument_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['userId', 'instrument_id']);
            $table->index('userId');
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });

        Course::query()
            ->where('instrument', 'Акустическая гитара')
            ->update(['instrument' => 'Гитара']);

        $this->backfillUserInstruments();
    }

    public function down(): void
    {
        Schema::dropIfExists('user_instruments');
        Schema::dropIfExists('course_enrollments');
    }

    private function backfillUserInstruments(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasTable('instruments')) {
            return;
        }

        $instrumentsByName = Instrument::query()->pluck('id', 'name');

        User::query()
            ->whereNotNull('instrument')
            ->get(['id', 'instrument'])
            ->each(function (User $user) use ($instrumentsByName): void {
                $instrumentId = $instrumentsByName[$user->instrument] ?? null;

                if ($instrumentId) {
                    DB::table('user_instruments')->updateOrInsert([
                        'userId' => $user->id,
                        'instrument_id' => $instrumentId,
                    ], [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });
    }
};
