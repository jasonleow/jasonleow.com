export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  const scriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
  if (!scriptUrl) {
    return new Response(JSON.stringify({ error: 'Script URL not configured' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  try {
    // Get the request data
    const requestData = await request.text();
    console.log('Edge function received request data:', requestData);

    // Forward the request to Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestData,
    });

    // Log response status and headers
    console.log('Google Apps Script response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status: ${response.status}`);
    }

    // Get response data and verify it's JSON
    const responseData = await response.text();
    console.log('Google Apps Script raw response:', responseData);
    
    try {
      JSON.parse(responseData); // Verify it's valid JSON
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid JSON response from Google Apps Script');
    }

    // Return the response from Google Apps Script
    return new Response(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
    });
  } catch (error) {
    console.error('Edge function detailed error:', {
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }
}

// Configure the function to handle specific paths
export const config = {
  path: "/get-script-url"
};
