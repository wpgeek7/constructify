<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Moondream AI API Configuration
    |--------------------------------------------------------------------------
    */
    
    'api_key' => env('MOONDREAM_API_KEY'),
    'api_url' => env('MOONDREAM_API_URL', 'https://api.moondream.ai/v1'),
    'timeout' => env('MOONDREAM_TIMEOUT', 30), // seconds
    'retry_attempts' => env('MOONDREAM_RETRY_ATTEMPTS', 3),
    'retry_delay' => env('MOONDREAM_RETRY_DELAY', 1000), // milliseconds

    /*
    |--------------------------------------------------------------------------
    | Analysis Settings
    |--------------------------------------------------------------------------
    */

    'auto_analyze_uploads' => env('AI_ANALYSIS_AUTO_ENABLED', true),
    'compliance_threshold' => env('AI_COMPLIANCE_THRESHOLD', 80), // % score below which it's a concern

    /*
    |--------------------------------------------------------------------------
    | Construction Safety Questions
    |--------------------------------------------------------------------------
    */

    'safety_questions' => [
        'hard_hats' => 'Are all workers wearing hard hats?',
        'safety_vests' => 'Are all workers wearing safety vests or high-visibility clothing?',
        'safety_glasses' => 'Are all workers wearing safety glasses or goggles?',
        'gloves' => 'Are workers wearing appropriate gloves?',
        'hazards' => 'Are there any visible safety hazards in this image?',
        'equipment' => 'Is all equipment being used safely and properly?',
        'environment' => 'Is the work environment safe and free from obvious risks?',
    ],

    /*
    |--------------------------------------------------------------------------
    | Object Detection Categories
    |--------------------------------------------------------------------------
    */

    'detection_categories' => [
        // People & PPE
        'person', 'worker', 'hard hat', 'safety vest', 'safety glasses', 'gloves',
        
        // Equipment
        'excavator', 'crane', 'forklift', 'scaffolding', 'ladder', 'bulldozer',
        'cement mixer', 'dump truck', 'backhoe',
        
        // Materials
        'construction material', 'concrete', 'steel beams', 'lumber', 'bricks',
        'debris', 'tools',
        
        // Hazards
        'open trench', 'fall hazard', 'exposed wiring', 'wet floor',
        
        // Safety Equipment
        'fire extinguisher', 'first aid kit', 'warning sign', 'safety barrier',
        'caution tape',
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Model Configuration
    |--------------------------------------------------------------------------
    */

    'default_model' => env('MOONDREAM_MODEL', 'moondream-2b'),
];
