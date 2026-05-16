# Playnote Laravel + Inertia + React

Playnote is now a Laravel application with an Inertia React frontend. The original React landing/course experience lives under `resources/js`, while Laravel handles routing, sessions, Kimi OAuth, and course request persistence.

## Stack

- Laravel 13 + PHP 8.3
- Inertia Laravel + `@inertiajs/react`
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui source components
- MySQL for users and course requests

## Local Setup

1. Install PHP dependencies:

   ```bash
   composer install
   ```

2. Install JavaScript dependencies:

   ```bash
   npm install
   ```

3. Copy the environment file and generate the app key:

   ```bash
   copy .env.example .env
   php artisan key:generate
   ```

4. Configure `.env`:

   ```dotenv
   DB_CONNECTION=mysql
   DB_DATABASE=kimi
   DB_USERNAME=root
   DB_PASSWORD=

   APP_ID=
   APP_SECRET=
   KIMI_AUTH_URL=
   KIMI_OPEN_URL=
   VITE_KIMI_AUTH_URL="${KIMI_AUTH_URL}"
   VITE_APP_ID="${APP_ID}"
   ```

5. Run migrations:

   ```bash
   php artisan migrate
   ```

6. Start both servers:

   ```bash
   php artisan serve
   npm run dev
   ```

Open `http://127.0.0.1:8000`.

## Main Files

- `routes/web.php` - Inertia pages, Kimi OAuth callback, logout, and course request endpoint
- `app/Http/Controllers/KimiAuthController.php` - Kimi OAuth callback and session logout
- `app/Http/Controllers/CourseRequestController.php` - course request persistence
- `database/migrations/*course_requests*` - course request table
- `resources/views/app.blade.php` - Inertia root template
- `resources/js/inertia.tsx` - Inertia React entrypoint
- `resources/js/pages/Home.tsx` - main landing/course app page
- `resources/js/pages/CourseDetail.tsx` - Inertia course detail page

## Checks

```bash
npm run check
npm run build
php artisan test
```
