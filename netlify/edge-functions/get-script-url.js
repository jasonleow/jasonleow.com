export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Get the script URL from environment variable
  const scriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
  
  if (!scriptUrl) {
    return new Response('Script URL not configured', { status: 500 });
  }

  // Return the URL with CORS headers
  return new Response(
    JSON.stringify({ url: scriptUrl }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
    }
  );
}

// Configure the function to handle specific paths
export const config = {
  path: "/get-script-url"
};
