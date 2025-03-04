export default async function handler(request) {
  // Allow both GET and POST requests
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const scriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
  if (!scriptUrl) {
    return new Response('Script URL not configured', { status: 500 });
  }

  try {
    // Get the request data
    const requestData = await request.text();

    // Forward the request to Google Apps Script
    const response = await fetch(scriptUrl + (request.method === 'GET' ? '?' + requestData : ''), {
      method: request.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: request.method === 'POST' ? requestData : null,
    });

    const data = await response.text();

    // Return the response from Google Apps Script
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Configure the function to handle specific paths
export const config = {
  path: "/get-script-url"
};
