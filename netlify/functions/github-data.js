const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Since we're using GraphQL, we only want to allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed - this endpoint only accepts POST requests' })
    };
  }

  try {
    // Get the GitHub token from environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      throw new Error('GitHub token not configured in environment variables');
    }

    // Parse the incoming request body
    // The body will contain the GraphQL query from the frontend
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body - expected JSON' })
      };
    }

    // Validate that we have a query
    if (!requestBody.query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No GraphQL query provided' })
      };
    }

    // Forward the request to GitHub's GraphQL API
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Serverless-Function'  // GitHub requires a User-Agent
      },
      body: JSON.stringify(requestBody)  // Forward the query exactly as received
    });

    // Get the response data
    const data = await response.json();

    // Return the GitHub API response directly
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error in serverless function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}
