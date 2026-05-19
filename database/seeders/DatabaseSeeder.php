<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['unionId' => 'test-user'],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'lastSignInAt' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['unionId' => 'seed-moderator'],
            [
                'name' => 'Moderator',
                'email' => 'moderator@example.com',
                'password' => Hash::make('secret123'),
                'role' => 'moderator',
                'lastSignInAt' => now(),
            ],
        );

        $this->call(PlatformSeeder::class);
    }
}
