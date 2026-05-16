<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unionId' => fake()->uuid(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'avatar' => null,
            'role' => 'user',
            'lastSignInAt' => now(),
        ];
    }
}
