<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            font-size: 22px;
            margin: 0 0 20px 0;
        }
        .content p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 20px 0;
        }
        .code-box {
            background-color: #fef3c7;
            border: 2px dashed #fbbf24;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: 700;
            color: #92400e;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .expires {
            color: #92400e;
            font-size: 14px;
            margin-top: 10px;
        }
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #9ca3af;
            font-size: 14px;
            margin: 5px 0;
        }
        .logo-section {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo-text {
            font-size: 24px;
            font-weight: 700;
            color: #ff6b35;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">🏗️ Constructify</div>
            <h1>Verify Your Email</h1>
        </div>

        <div class="content">
            <h2>Welcome to Constructify!</h2>
            <p>Thank you for creating an account. To complete your registration and start using Constructify, please verify your email address.</p>

            <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">Your Verification Code:</p>
                <div class="code">{{ $verificationCode }}</div>
                <p class="expires">⏰ Expires in 15 minutes</p>
            </div>

            <div class="info-box">
                <p>📋 Simply enter this code in the verification page to activate your account.</p>
            </div>

            <p>If you didn't create an account with Constructify, please ignore this email.</p>
        </div>

        <div class="footer">
            <p><strong>Constructify</strong></p>
            <p>Building the future, one project at a time</p>
            <p style="margin-top: 15px;">© {{ date('Y') }} Constructify. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

