// Add score verification
function verifyScoreChecksum(score, checksum) {
    const gameSecret = 'space-defenders-v1';
    const expectedChecksum = btoa(`${score}-${gameSecret}`);
    return checksum === expectedChecksum;
}

// Add input validation functions
function sanitizeName(name) {
    if (typeof name !== 'string') return '';
    return name
        .trim()
        .replace(/[^\w\s-]/g, '')  // Only allow alphanumeric, spaces, hyphens
        .substring(0, 20);         // Max 20 chars
}

function validateScore(score) {
    // Convert to number and validate
    const numScore = parseInt(score);
    
    // Game scoring logic:
    // - Each alien gives (ALIEN_ROWS - type) * 10 points
    // - Each wave has 55 aliens (5 rows * 11 cols)
    // - Players can complete multiple waves
    // - Let's set a reasonable limit of 100 waves
    // Max per wave: (50 + 40 + 30 + 20 + 10) * 11 = 1650 points
    const MAX_POINTS_PER_WAVE = 1650;
    const MAX_REASONABLE_WAVES = 100;
    const MAX_POSSIBLE_SCORE = MAX_POINTS_PER_WAVE * MAX_REASONABLE_WAVES; // 165,000

    return !isNaN(numScore) && 
           numScore >= 0 && 
           numScore <= MAX_POSSIBLE_SCORE && 
           Number.isInteger(numScore);
}

// Add common headers used throughout responses
const commonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
};

// Helper function for error responses
function errorResponse(message, status = 400) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: commonHeaders
    });
}

export default async function handler(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    const scriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
    if (!scriptUrl) {
        return errorResponse('Script URL not configured', 500);
    }

    try {
        const requestData = await request.text();
        const params = new URLSearchParams(requestData);
        
        if (params.get('action') === 'create') {
            const score = parseInt(params.get('highScore'));
            const playerName = params.get('playerName');
            const checksum = params.get('checksum');

            // Validate all required fields
            if (!playerName || !score || !checksum) {
                return errorResponse('Missing required fields');
            }

            // Validate and sanitize player name
            const sanitizedName = sanitizeName(playerName);
            if (!sanitizedName) {
                return errorResponse('Invalid player name');
            }

            // Validate score
            if (!validateScore(score)) {
                return errorResponse('Invalid score value');
            }

            // Verify checksum
            if (!verifyScoreChecksum(score, checksum)) {
                return errorResponse('Score verification failed');
            }

            // Create sanitized request
            requestData = new URLSearchParams({
                action: 'create',
                playerName: sanitizedName,
                highScore: score
            }).toString();
        }

        // Forward the request to Google Apps Script
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestData,
        });

        if (!response.ok) {
            throw new Error(`Google Apps Script responded with status: ${response.status}`);
        }

        const responseData = await response.text();
        
        try {
            JSON.parse(responseData); // Verify it's valid JSON
        } catch (e) {
            throw new Error('Invalid JSON response from Google Apps Script');
        }

        return new Response(responseData, { headers: commonHeaders });
        
    } catch (error) {
        console.error('Edge function error:', error);
        return errorResponse(error.message, 500);
    }
}

// Configure the function to handle specific paths
export const config = {
    path: "/get-script-url"
};
