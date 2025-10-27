<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MoondreamService
{
    protected $apiKey;
    protected $apiUrl;
    protected $timeout;

    public function __construct()
    {
        $this->apiKey = config('moondream.api_key');
        $this->apiUrl = config('moondream.api_url', 'https://api.moondream.ai/v1');
        $this->timeout = config('moondream.timeout', 30);
    }

    /**
     * Perform comprehensive AI analysis on an image
     */
    public function analyzeImage(string $imageData): array
    {
        $startTime = microtime(true);
        
        try {
            // 1. Get detailed description
            $detailedDescription = $this->getDetailedDescription($imageData);
            
            // 2. Identify objects and people
            $objects = $this->identifyObjects($imageData);
            $peopleCount = $this->countPeople($imageData);
            $peopleDetails = $this->analyzePeople($imageData);
            
            // 3. Scene understanding
            $sceneType = $this->analyzeSceneType($imageData);
            $timeOfDay = $this->analyzeTimeOfDay($imageData);
            $weather = $this->analyzeWeather($imageData);
            $lighting = $this->analyzeLighting($imageData);
            $mood = $this->analyzeSceneMood($imageData);
            
            // 4. Text extraction
            $extractedText = $this->extractText($imageData);
            
            // 5. Activity recognition
            $activities = $this->recognizeActivities($imageData);
            $primaryActivity = $this->getPrimaryActivity($imageData);
            
            // 6. Color analysis
            $colors = $this->analyzeColors($imageData);
            $palette = $this->getColorPalette($imageData);
            $aesthetics = $this->analyzeAesthetics($imageData);
            
            // 7. Quality assessment
            $quality = $this->assessQuality($imageData);
            $isBlurry = $this->checkBlurriness($imageData);
            $exposure = $this->checkExposure($imageData);
            $composition = $this->analyzeComposition($imageData);
            
            // 8. Safety compliance (construction-specific)
            $safetyCompliance = $this->analyzeSafetyCompliance($imageData);
            
            $processingTime = round((microtime(true) - $startTime) * 1000);
            
            return [
                'success' => true,
                'caption' => $detailedDescription['brief'] ?? '',
                'detailed_description' => $detailedDescription['detailed'] ?? '',
                
                // Objects & People
                'objects_detected' => $objects,
                'people_count' => $peopleCount,
                'people_details' => $peopleDetails,
                
                // Scene Understanding
                'scene_type' => $sceneType,
                'time_of_day' => $timeOfDay,
                'weather_condition' => $weather,
                'lighting_quality' => $lighting,
                'scene_mood' => $mood,
                
                // Text & Activities
                'extracted_text' => $extractedText,
                'activities_detected' => $activities,
                'primary_activity' => $primaryActivity,
                
                // Visual Analysis
                'dominant_colors' => $colors,
                'color_palette' => $palette,
                'visual_aesthetics' => $aesthetics,
                
                // Quality
                'image_quality' => $quality,
                'is_blurry' => $isBlurry,
                'is_overexposed' => $exposure['overexposed'] ?? false,
                'is_underexposed' => $exposure['underexposed'] ?? false,
                'composition_notes' => $composition,
                
                // Safety (construction)
                'safety_compliance' => $safetyCompliance['compliance'] ?? [],
                'compliance_score' => $safetyCompliance['score'] ?? 0,
                'has_violations' => $safetyCompliance['has_violations'] ?? false,
                'violations_count' => $safetyCompliance['violations_count'] ?? 0,
                
                'processing_time_ms' => $processingTime,
                'ai_model_version' => 'moondream-2b',
                'analyzed_at' => now(),
            ];
            
        } catch (\Exception $e) {
            Log::error('Moondream comprehensive analysis failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get detailed description of the image
     */
    protected function getDetailedDescription(string $imageData): array
    {
        $brief = $this->askQuestion($imageData, "Describe this image in one sentence.");
        $detailed = $this->askQuestion($imageData, "Provide a comprehensive, detailed description of everything visible in this image, including objects, people, setting, colors, and atmosphere.");
        
        return [
            'brief' => $brief,
            'detailed' => $detailed
        ];
    }

    /**
     * Identify all objects in the image
     */
    protected function identifyObjects(string $imageData): array
    {
        $response = $this->askQuestion($imageData, "List all objects, equipment, materials, and items visible in this image. Provide the list as comma-separated values.");
        $objects = array_map('trim', explode(',', $response));
        return array_values(array_filter($objects));
    }

    /**
     * Count people in the image
     */
    protected function countPeople(string $imageData): int
    {
        $response = $this->askQuestion($imageData, "How many people are visible in this image? Respond with only a number.");
        return (int) filter_var($response, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * Analyze people details
     */
    protected function analyzePeople(string $imageData): array
    {
        $response = $this->askQuestion($imageData, "Describe each person visible: their position, what they're wearing, and what they're doing.");
        return ['description' => $response];
    }

    /**
     * Analyze scene type
     */
    protected function analyzeSceneType(string $imageData): string
    {
        return $this->askQuestion($imageData, "Is this an indoor or outdoor scene? What type of location is it? (e.g., construction site, office, home, street, etc.) Provide a brief answer.");
    }

    /**
     * Analyze time of day
     */
    protected function analyzeTimeOfDay(string $imageData): string
    {
        return $this->askQuestion($imageData, "Based on the lighting, what time of day does this appear to be? (morning/afternoon/evening/night/unknown)");
    }

    /**
     * Analyze weather conditions
     */
    protected function analyzeWeather(string $imageData): string
    {
        return $this->askQuestion($imageData, "If this is an outdoor scene, what weather conditions are visible? (sunny/cloudy/rainy/foggy/snowy/unknown)");
    }

    /**
     * Analyze lighting quality
     */
    protected function analyzeLighting(string $imageData): string
    {
        return $this->askQuestion($imageData, "Describe the lighting in this image. Is it well-lit, dim, bright, natural light, artificial light, or mixed?");
    }

    /**
     * Analyze scene mood
     */
    protected function analyzeSceneMood(string $imageData): string
    {
        return $this->askQuestion($imageData, "What is the overall mood or atmosphere of this scene? (e.g., busy, calm, professional, casual, chaotic, organized)");
    }

    /**
     * Extract text from image (OCR)
     */
    protected function extractText(string $imageData): ?string
    {
        $response = $this->askQuestion($imageData, "Is there any visible text, signs, labels, or writing in this image? If yes, what does it say?");
        return strpos(strtolower($response), 'no') === 0 ? null : $response;
    }

    /**
     * Recognize activities
     */
    protected function recognizeActivities(string $imageData): array
    {
        $response = $this->askQuestion($imageData, "What activities or actions are taking place in this image? List all activities you can identify.");
        $activities = array_map('trim', explode('.', $response));
        return array_values(array_filter($activities));
    }

    /**
     * Get primary activity
     */
    protected function getPrimaryActivity(string $imageData): string
    {
        return $this->askQuestion($imageData, "What is the main activity or primary focus of this image?");
    }

    /**
     * Analyze colors
     */
    protected function analyzeColors(string $imageData): array
    {
        $response = $this->askQuestion($imageData, "What are the dominant colors in this image? List the top 3-5 colors in order of prominence.");
        $colors = array_map('trim', explode(',', $response));
        return array_values(array_filter($colors));
    }

    /**
     * Get color palette
     */
    protected function getColorPalette(string $imageData): string
    {
        return $this->askQuestion($imageData, "Describe the overall color scheme or palette of this image (e.g., warm/cool, vibrant/muted, monochromatic/colorful).");
    }

    /**
     * Analyze aesthetics
     */
    protected function analyzeAesthetics(string $imageData): string
    {
        return $this->askQuestion($imageData, "Analyze the visual composition: Is the image well-balanced? How is the subject framed? Describe the overall aesthetic quality.");
    }

    /**
     * Assess image quality
     */
    protected function assessQuality(string $imageData): string
    {
        $response = $this->askQuestion($imageData, "Rate the technical quality of this image: excellent, good, fair, or poor. Consider clarity, focus, and exposure.");
        $response = strtolower($response);
        
        if (strpos($response, 'excellent') !== false) return 'excellent';
        if (strpos($response, 'good') !== false) return 'good';
        if (strpos($response, 'fair') !== false) return 'fair';
        if (strpos($response, 'poor') !== false) return 'poor';
        
        return 'unknown';
    }

    /**
     * Check if image is blurry
     */
    protected function checkBlurriness(string $imageData): bool
    {
        $response = $this->askQuestion($imageData, "Is this image blurry or out of focus? Answer yes or no.");
        return stripos($response, 'yes') !== false;
    }

    /**
     * Check exposure
     */
    protected function checkExposure(string $imageData): array
    {
        $response = $this->askQuestion($imageData, "Is this image overexposed (too bright) or underexposed (too dark)? Answer: overexposed, underexposed, or properly exposed.");
        $response = strtolower($response);
        
        return [
            'overexposed' => strpos($response, 'overexposed') !== false,
            'underexposed' => strpos($response, 'underexposed') !== false,
        ];
    }

    /**
     * Analyze composition
     */
    protected function analyzeComposition(string $imageData): string
    {
        return $this->askQuestion($imageData, "Analyze the composition and framing of this image. Comment on focus, clarity, angle, and overall photographic quality.");
    }

    /**
     * Analyze safety compliance (construction-specific)
     */
    protected function analyzeSafetyCompliance(string $imageData): array
    {
        $questions = config('moondream.safety_questions', [
            'hard_hats' => 'Are all workers wearing hard hats?',
            'safety_vests' => 'Are all workers wearing safety vests or high-visibility clothing?',
            'safety_glasses' => 'Are all workers wearing safety glasses or goggles?',
            'gloves' => 'Are workers wearing appropriate gloves?',
            'hazards' => 'Are there any visible safety hazards in this image?',
            'equipment' => 'Is all equipment being used safely and properly?',
            'environment' => 'Is the work environment safe and free from obvious risks?',
        ]);

        $compliance = [];
        $passedCount = 0;

        foreach ($questions as $key => $question) {
            $answer = $this->askQuestion($imageData, $question);
            $passed = stripos($answer, 'yes') !== false && stripos($answer, 'no') === false;
            
            $compliance[$key] = [
                'question' => $question,
                'answer' => $answer,
                'passed' => $passed
            ];

            if ($passed) $passedCount++;
        }

        $totalQuestions = count($questions);
        $score = $totalQuestions > 0 ? round(($passedCount / $totalQuestions) * 100) : 0;
        $hasViolations = $score < config('moondream.compliance_threshold', 80);

        return [
            'compliance' => $compliance,
            'score' => $score,
            'has_violations' => $hasViolations,
            'violations_count' => $hasViolations ? ($totalQuestions - $passedCount) : 0,
        ];
    }

    /**
     * Ask a single question to Moondream API
     */
    protected function askQuestion(string $imageData, string $question): string
    {
        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiUrl . '/query', [
                    'image_url' => $imageData,
                    'question' => $question,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['answer'] ?? $data['response'] ?? $data['result'] ?? '';
            }

            Log::error('Moondream API error: ' . $response->body());
            return '';
            
        } catch (\Exception $e) {
            Log::error('Moondream question failed: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Validate API key
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiUrl);
    }
}

