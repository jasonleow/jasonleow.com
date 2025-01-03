// netlify/edge-functions/github-data.js

// Edge functions use the Context object to access environment variables
export default async function handler(request, context) {
  // We still only want to allow POST requests
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
    // Get the GitHub token from environment variables using context
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    
    if (!githubToken) {
      throw new Error('GitHub token not configured in environment variables');
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

    // Validate that we have a query
    if (!requestBody.query) {
      return new Response(
        JSON.stringify({ error: 'No GraphQL query provided' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Forward the request to GitHub's GraphQL API
    // Note: Using the native fetch API (no need to import)
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Edge-Function'
      },
      body: JSON.stringify(requestBody)
    });

    // Get the response data
    const data = await response.json();

    // Return the GitHub API response
    return new Response(
      JSON.stringify(data),
      {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
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

// Configure the function to handle specific paths
export const config = {
  path: "/github-data"
};
