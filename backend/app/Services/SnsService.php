<?php

namespace App\Services;

use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;
use Illuminate\Support\Facades\Log;

class SnsService
{
    protected $snsClient;
    protected $enabled;

    public function __construct()
    {
        $this->enabled = config('services.sns.enabled', false);
        
        if ($this->enabled) {
            $this->snsClient = new SnsClient([
                'region' => config('services.sns.region', 'us-east-1'),
                'version' => 'latest',
                'credentials' => [
                    'key' => config('services.sns.key'),
                    'secret' => config('services.sns.secret'),
                ],
            ]);
        }
    }

    /**
     * Send OTP via SMS using Amazon SNS
     * 
     * @param string $phoneNumber Phone number with country code (e.g., +1234567890)
     * @param string $otp The OTP code to send
     * @return array ['success' => bool, 'message' => string, 'message_id' => string|null]
     */
    public function sendOTP(string $phoneNumber, string $otp): array
    {
        // If SNS is disabled (for development), just log the OTP
        if (!$this->enabled) {
            Log::info("SMS OTP (DEV MODE): Phone: {$phoneNumber}, OTP: {$otp}");
            return [
                'success' => true,
                'message' => 'OTP logged (development mode)',
                'message_id' => 'dev-' . time(),
                'otp' => $otp, // Only in dev mode for testing
            ];
        }

        try {
            $message = "Your Constructify verification code is: {$otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this message.";

            $result = $this->snsClient->publish([
                'Message' => $message,
                'PhoneNumber' => $phoneNumber,
                'MessageAttributes' => [
                    'AWS.SNS.SMS.SenderID' => [
                        'DataType' => 'String',
                        'StringValue' => 'Constructify'
                    ],
                    'AWS.SNS.SMS.SMSType' => [
                        'DataType' => 'String',
                        'StringValue' => 'Transactional' // Use Transactional for OTP
                    ]
                ]
            ]);

            Log::info("SMS OTP sent successfully to {$phoneNumber}", [
                'message_id' => $result['MessageId']
            ]);

            return [
                'success' => true,
                'message' => 'OTP sent successfully',
                'message_id' => $result['MessageId'],
            ];

        } catch (AwsException $e) {
            Log::error("Failed to send SMS OTP to {$phoneNumber}: " . $e->getMessage(), [
                'error_code' => $e->getAwsErrorCode(),
                'error_type' => $e->getAwsErrorType(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.',
                'error' => $e->getMessage(),
            ];
        } catch (\Exception $e) {
            Log::error("Unexpected error sending SMS OTP to {$phoneNumber}: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'An unexpected error occurred. Please try again.',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Format phone number with country code
     * 
     * @param string $phoneNumber Raw phone number
     * @param string $countryCode Country code (e.g., +1)
     * @return string Formatted phone number
     */
    public function formatPhoneNumber(string $phoneNumber, string $countryCode = '+1'): string
    {
        // Remove any non-digit characters
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);
        
        // Add country code if not present
        if (!str_starts_with($phoneNumber, '+')) {
            $phoneNumber = $countryCode . $phoneNumber;
        }
        
        return $phoneNumber;
    }

    /**
     * Validate phone number format
     * 
     * @param string $phoneNumber Phone number to validate
     * @return bool True if valid
     */
    public function validatePhoneNumber(string $phoneNumber): bool
    {
        // Basic validation: check if it's a valid phone number format
        // Should start with + and have 10-15 digits
        return preg_match('/^\+[1-9]\d{9,14}$/', $phoneNumber) === 1;
    }

    /**
     * Generate a random 6-digit OTP
     * 
     * @return string 6-digit OTP
     */
    public function generateOTP(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Send welcome SMS
     * 
     * @param string $phoneNumber Phone number with country code
     * @param string $name User's name
     * @return array Response array
     */
    public function sendWelcomeSMS(string $phoneNumber, string $name): array
    {
        if (!$this->enabled) {
            Log::info("Welcome SMS (DEV MODE): Phone: {$phoneNumber}, Name: {$name}");
            return [
                'success' => true,
                'message' => 'Welcome SMS logged (development mode)',
            ];
        }

        try {
            $message = "Welcome to Constructify, {$name}! 🏗️\n\nYour account has been created successfully. Start managing your construction projects today!\n\nFor support, contact us at groundbreaktech@gmail.com";

            $result = $this->snsClient->publish([
                'Message' => $message,
                'PhoneNumber' => $phoneNumber,
            ]);

            Log::info("Welcome SMS sent to {$phoneNumber}");

            return [
                'success' => true,
                'message' => 'Welcome SMS sent',
                'message_id' => $result['MessageId'],
            ];

        } catch (\Exception $e) {
            Log::error("Failed to send welcome SMS to {$phoneNumber}: " . $e->getMessage());
            // Don't fail registration if welcome SMS fails
            return [
                'success' => false,
                'message' => 'Failed to send welcome SMS',
            ];
        }
    }

    /**
     * Check if SNS is enabled
     * 
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}

