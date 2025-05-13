// Cloudflare Worker Script (e.g., worker.js)

// Configuration: In a real deployment, set a specific origin or list of origins.
// For development, '*' is often used but is less secure.
const ALLOWED_ORIGIN = '*'; // Replace with your web app's domain in production

async function handleRequest(request) {
  const url = new URL(request.url);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Set CORS headers for actual requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Allow POST if you plan to send data
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow Authorization for Canvas token
  };

  try {
    if (url.pathname === '/compass') {
      const compassFeedUrl = url.searchParams.get('url');
      if (!compassFeedUrl) {
        return new Response(JSON.stringify({ error: 'Missing Compass URL parameter (url)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(compassFeedUrl, {
        headers: {
          'User-Agent': 'CalendarViewerWorker/1.0' // Good practice to set a User-Agent
        }
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch Compass data: ${response.status} ${response.statusText}` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const icsData = await response.text();
      return new Response(icsData, {
        headers: { ...corsHeaders, 'Content-Type': 'text/calendar' },
      });

    } else if (url.pathname.startsWith('/canvas/')) {
      // Example: /canvas/api/v1/courses or /canvas/api/v1/courses/123/assignments
      const canvasDomain = url.searchParams.get('domain');
      const canvasToken = request.headers.get('Authorization'); // Get token from Authorization header
      const canvasApiEndpoint = url.pathname.substring('/canvas/'.length) + url.search; // Get the rest of the path and query string

      if (!canvasDomain) {
        return new Response(JSON.stringify({ error: 'Missing Canvas domain parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!canvasToken || !canvasToken.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Canvas API token in Authorization header (Bearer YOUR_TOKEN)' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!canvasApiEndpoint) {
        return new Response(JSON.stringify({ error: 'Missing Canvas API endpoint' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fullCanvasUrl = new URL(canvasApiEndpoint, canvasDomain).toString();

      const canvasResponse = await fetch(fullCanvasUrl, {
        headers: {
          'Authorization': canvasToken,
          'User-Agent': 'CalendarViewerWorker/1.0',
        },
      });

      if (!canvasResponse.ok) {
         const errorBody = await canvasResponse.text();
        return new Response(JSON.stringify({
            error: `Canvas API request failed: ${canvasResponse.status} ${canvasResponse.statusText}`,
            canvas_error: errorBody
        }), {
          status: canvasResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const canvasData = await canvasResponse.json();
      return new Response(JSON.stringify(canvasData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Not Found. Use /compass or /canvas endpoints.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Worker Error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function handleOptions(request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    let respHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers'),
      'Access-Control-Max-Age': '86400', // Cache preflight for 1 day
    };
    return new Response(null, { headers: respHeaders });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'GET, POST, OPTIONS',
      },
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
