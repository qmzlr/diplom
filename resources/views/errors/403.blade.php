<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Доступ запрещён - Playnote</title>
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f4f2ed; color: #0b0b0b; }
        main { width: min(520px, calc(100% - 32px)); border: 1px solid #111; background: #fff; padding: 32px; }
        h1 { margin: 0 0 12px; font-size: 52px; font-weight: 400; }
        p { margin: 0 0 24px; color: #555; line-height: 1.5; }
        a { color: #000; text-transform: uppercase; letter-spacing: .08em; text-decoration: none; border-bottom: 1px solid currentColor; }
    </style>
</head>
<body>
<main>
    <h1>403</h1>
    <p>{{ $exception->getMessage() ?: 'Доступ запрещён.' }}</p>
    <a href="/">На главную</a>
</main>
</body>
</html>
