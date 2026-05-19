<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\EnsureSessionAuthenticated;
use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
        $middleware->alias([
            'session.auth' => EnsureSessionAuthenticated::class,
            'role' => EnsureUserRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($e instanceof ValidationException || ! $request->expectsJson()) {
                return null;
            }

            $status = $e instanceof ModelNotFoundException
                ? 404
                : ($e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500);
            $message = $e instanceof HttpExceptionInterface ? trim($e->getMessage()) : '';

            return response()->json([
                'message' => $message !== '' ? $message : match ($status) {
                    401 => 'Нужно войти в аккаунт.',
                    403 => 'Доступ запрещён.',
                    404 => 'Запрашиваемые данные не найдены.',
                    419 => 'Сессия истекла. Обновите страницу и попробуйте снова.',
                    429 => 'Слишком много запросов. Попробуйте позже.',
                    default => 'Не удалось выполнить запрос. Попробуйте позже.',
                },
            ], $status);
        });

        $exceptions->respond(function ($response, \Throwable $e, Request $request) {
            $contentType = (string) $response->headers->get('content-type', '');

            if ($response->getStatusCode() < 400 || ! ($request->expectsJson() || str_contains($contentType, 'application/json'))) {
                return $response;
            }

            $payload = json_decode((string) $response->getContent(), true);

            if (! is_array($payload)) {
                $payload = [];
            }

            $currentMessage = (string) ($payload['message'] ?? '');

            if ($currentMessage !== '' && preg_match('/[А-Яа-яЁё]/u', $currentMessage)) {
                return $response;
            }

            $payload['message'] = match ($response->getStatusCode()) {
                401 => 'Нужно войти в аккаунт.',
                403 => 'Доступ запрещён.',
                404 => 'Запрашиваемые данные не найдены.',
                419 => 'Сессия истекла. Обновите страницу и попробуйте снова.',
                422 => 'Проверьте заполненные поля.',
                429 => 'Слишком много запросов. Попробуйте позже.',
                default => 'Не удалось выполнить запрос. Попробуйте позже.',
            };

            return response()->json($payload, $response->getStatusCode(), $response->headers->all());
        });
    })->create();
