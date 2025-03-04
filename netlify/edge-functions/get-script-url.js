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

    // Get response data and verify it's JSON
    const responseData = await response.text();
    try {
      JSON.parse(responseData); // Verify it's valid JSON
    } catch (e) {
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
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error.message
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
