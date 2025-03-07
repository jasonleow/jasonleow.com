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

// Add game version validation
const CURRENT_GAME_VERSION = '1.0.1';

// Add session and token tracking
const activeSessions = new Map();
const usedTokens = new Set();

// Add timestamp validation
function validateTimestamps(data) {
    const now = Date.now();
    const MAX_SUBMISSION_DELAY = 60000; // 1 minute
    
    // Reject submissions that are too old
    if (now - data.endTime > MAX_SUBMISSION_DELAY) {
        return false;
    }
    
    // Reject submissions from the future
    if (data.endTime > now) {
        return false;
    }
    
    return true;
}

// Update gameplay validation
function validateGameplay(gameData) {
    try {
        const data = JSON.parse(gameData);
        console.log("Validating gameplay data:", data);
        
        // Version check
        if (data.gameVersion !== CURRENT_GAME_VERSION) {
            console.log("Version mismatch:", data.gameVersion, "!=", CURRENT_GAME_VERSION);
            return false;
        }
        
        // Token check
        if (usedTokens.has(data.submissionToken)) {
            console.log("Token already used:", data.submissionToken);
            return false;
        }
        
        // Timestamp validation
        if (!validateTimestamps(data)) {
            console.log("Invalid timestamps:", {
                start: new Date(data.startTime).toISOString(),
                end: new Date(data.endTime).toISOString(),
                now: new Date().toISOString()
            });
            return false;
        }
        
        // Game duration check
        const gameDuration = data.endTime - data.startTime;
        const MIN_GAME_DURATION = 10000;  // Minimum 10 seconds
        const MAX_GAME_DURATION = 3600000; // Maximum 1 hour
        if (gameDuration < MIN_GAME_DURATION || gameDuration > MAX_GAME_DURATION) {
            console.log("Invalid duration:", gameDuration);
            return false;
        }

        // Events validation
        if (!Array.isArray(data.events) || data.events.length === 0) {
            console.log("Invalid events array:", data.events);
            return false;
        }

        // Event sequence validation
        let lastTimestamp = data.startTime;
        let expectedScore = 0;
        let lastSequence = -1;
        
        for (const event of data.events) {
            console.log("Validating event:", event);
            
            if (event.timestamp < lastTimestamp || event.timestamp > data.endTime) {
                console.log("Invalid event timestamp:", {
                    eventTime: event.timestamp,
                    lastTime: lastTimestamp,
                    endTime: data.endTime
                });
                return false;
            }
            
            if (event.sequence !== lastSequence + 1) {
                console.log("Invalid sequence:", {
                    expected: lastSequence + 1,
                    got: event.sequence
                });
                return false;
            }
            
            if (event.type.action === 'alienKill') {
                if (!validateAlienKill(event, expectedScore)) {
                    return false;
                }
                expectedScore += event.type.points;
            }
            
            lastTimestamp = event.timestamp;
            lastSequence = event.sequence;
        }
        
        // Final score validation
        if (expectedScore !== data.finalScore) {
            console.log("Score mismatch:", {
                expected: expectedScore,
                got: data.finalScore
            });
            return false;
        }
        
        return true;
    } catch (e) {
        console.error("Validation error:", e);
        return false;
    }
}

// Helper function to validate alien kill events
function validateAlienKill(event, currentScore) {
    const validAlienTypes = [0, 1, 2, 3, 4];
    if (!validAlienTypes.includes(event.type.alienType)) {
        console.log("Invalid alien type:", event.type.alienType);
        return false;
    }
    
    const expectedPoints = (5 - event.type.alienType) * 10;
    if (event.type.points !== expectedPoints) {
        console.log("Invalid points:", {
            expected: expectedPoints,
            got: event.type.points
        });
        return false;
    }
    
    return true;
}

function calculateScoreFromEvents(events) {
    return events.reduce((total, event) => {
        if (event.type.action === 'alienKill') {
            // Validate points based on alien type
            const expectedPoints = (5 - event.type.alienType) * 10;
            if (event.type.points !== expectedPoints) {
                throw new Error('Invalid points for alien type');
            }
            return total + event.type.points;
        }
        return total;
    }, 0);
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

// Update rate limiting to use persistent storage
// Note: This is a simplified version. In production, use Deno.KV or similar
const RATE_LIMIT = {
    window: 3600000, // 1 hour in milliseconds
    maxRequests: 10,
    // Add a cleanup interval to prevent memory leaks
    cleanupInterval: 3600000 // 1 hour
};

// Instead of using setInterval which might not be supported
// We'll clean up on each request
function cleanupOldData() {
    const now = Date.now();
    
    // Clean up rate limit data
    for (const [ip, times] of rateLimit.entries()) {
        const recentTimes = times.filter(time => now - time < RATE_LIMIT.window);
        if (recentTimes.length === 0) {
            rateLimit.delete(ip);
        } else {
            rateLimit.set(ip, recentTimes);
        }
    }
    
    // Clean up old tokens
    // Only keep tokens from the last 24 hours
    const TOKEN_TTL = 86400000; // 24 hours
    for (const token of usedTokens) {
        // Since we don't store timestamps with tokens,
        // we'll need to implement a more sophisticated
        // solution if this becomes a memory issue
    }
}

// Update checksum verification
async function verifyScoreChecksum(score, checksum, gameData) {
    const gameSecret = Deno.env.get('GAME_SECRET');
    if (!gameSecret) {
        throw new Error('Game secret not configured');
    }

    const data = JSON.parse(gameData);
    
    // Include more data in the verification
    const dataToVerify = JSON.stringify({
        score,
        sessionId: data.sessionId,
        submissionToken: data.submissionToken,
        gameVersion: data.gameVersion,
        events: data.events,
        startTime: data.startTime,
        endTime: data.endTime
    });

    // Use HMAC for better security
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(gameSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(dataToVerify)
    );

    const expectedChecksum = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return checksum === expectedChecksum;
}

// Add to handler function
const rateLimit = new Map(); // In production, use Redis or similar

export default async function handler(request) {
    // Clean up old data on each request
    cleanupOldData();
    
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const now = Date.now();
    const userRequests = rateLimit.get(clientIP) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT.window);
    
    if (recentRequests.length >= RATE_LIMIT.maxRequests) {
        return errorResponse('Too many score submissions. Please try again later.', 429);
    }
    
    // Update rate limit tracking
    recentRequests.push(now);
    rateLimit.set(clientIP, recentRequests);

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
        
        // Initialize variable for the data we'll send to Google Apps Script
        let dataToSend = requestData;  // Default to original request data

        if (params.get('action') === 'create') {
            const score = parseInt(params.get('highScore'));
            const playerName = params.get('playerName');
            const gameData = params.get('gameData');
            const checksum = params.get('checksum');

            // Validate all required fields
            if (!playerName || !score || !gameData || !checksum) {
                return errorResponse('Missing required fields');
            }

            // Validate gameplay data
            if (!validateGameplay(gameData)) {
                return errorResponse('Invalid gameplay data');
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

            // Verify checksum with both score and gameplay data
            if (!await verifyScoreChecksum(score, checksum, gameData)) {
                return errorResponse('Score verification failed');
            }

            // Mark token as used
            try {
                const parsedData = JSON.parse(gameData);
                if (parsedData.submissionToken) {
                    usedTokens.add(parsedData.submissionToken);
                }
            } catch (e) {
                // Ignore parsing errors here
            }

            // Create sanitized request
            dataToSend = new URLSearchParams({
                action: 'create',
                playerName: sanitizedName,
                highScore: score,
                gameData: gameData
            }).toString();
        }

        // Forward the request to Google Apps Script
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: dataToSend,  // Use the potentially sanitized data
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
