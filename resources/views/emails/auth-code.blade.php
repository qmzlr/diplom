<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;background:#f4f4f5;color:#111;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #111;">
                    <tr>
                        <td style="padding:34px 34px 28px;">
                            <p style="margin:0 0 24px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#666;">PlayNote</p>
                            <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;font-weight:400;">{{ $title }}</h1>
                            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#444;">{{ $intro }}</p>
                            <div style="margin:0 0 24px;padding:18px 20px;border:1px solid #111;font-size:30px;letter-spacing:.28em;text-align:center;font-weight:700;">
                                {{ $code }}
                            </div>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#666;">
                                Код действует {{ $ttlMinutes }} минут. Если вы не запрашивали это письмо, просто проигнорируйте его.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
