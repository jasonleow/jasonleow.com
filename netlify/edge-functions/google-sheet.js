export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed - this endpoint only accepts POST requests' }), 
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get the Google Script URL from environment variables
    const scriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
    
    if (!scriptUrl) {
      throw new Error('Google Script URL not configured in environment variables');
    }

    // Parse the incoming request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body - expected JSON' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request body
    if (!requestBody.action) {
      return new Response(
        JSON.stringify({ error: 'No action specified' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Forward the request to Google Apps Script
    const formData = new URLSearchParams();
    Object.entries(requestBody).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Netlify-Edge-Function'
      },
      body: formData.toString()
    });

    // Get the response data
    const data = await response.text();

    // Return the Google Script response
    return new Response(
      data,
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Allow CORS
        }
      }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const config = {
  path: "/google-sheet"
}; 
