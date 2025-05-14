// Cloudflare Worker Script (e.g., worker.js)

const ALLOWED_ORIGIN = '*'; // Replace with your web app's domain in production

async function handleRequest(request) {
  const requestUrlObj = new URL(request.url); // Use a new URL object for manipulation

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Set CORS headers for actual requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    if (requestUrlObj.pathname === '/compass') {
      const compassFeedUrl = requestUrlObj.searchParams.get('url');
      if (!compassFeedUrl) {
        return new Response(JSON.stringify({ error: 'Missing Compass URL parameter (url)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(compassFeedUrl, {
        headers: { 'User-Agent': 'CalendarViewerWorker/1.0' }
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

    } else if (requestUrlObj.pathname.startsWith('/canvas/')) {
      const canvasDomain = requestUrlObj.searchParams.get('domain');
      const canvasToken = request.headers.get('Authorization');

      // Remove the 'domain' param from searchParams before constructing the Canvas API endpoint query
      const canvasApiSearchParams = new URLSearchParams(requestUrlObj.search);
      canvasApiSearchParams.delete('domain');

      const canvasApiPath = requestUrlObj.pathname.substring('/canvas/'.length);
      const canvasApiQuery = canvasApiSearchParams.toString();
      const canvasApiEndpoint = canvasApiPath + (canvasApiQuery ? `?${canvasApiQuery}` : '');


      if (!canvasDomain) {
        return new Response(JSON.stringify({ error: 'Missing Canvas domain parameter in worker request' }), {
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
      if (!canvasApiEndpoint) { // Should not happen if path starts with /canvas/
        return new Response(JSON.stringify({ error: 'Missing Canvas API endpoint path' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Construct the full URL to the actual Canvas API
      // canvasDomain is the base (e.g., https://sfx.instructure.com)
      // canvasApiEndpoint is the path and its specific query (e.g., api/v1/courses?enrollment_state=active)
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
            canvas_error: errorBody,
            requested_canvas_url: fullCanvasUrl // For debugging
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
      return new Response(JSON.stringify({ error: 'Not Found. Use /compass or /canvas/* endpoints.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Worker Error:', error.stack); // Log stack for better debugging
    return new Response(JSON.stringify({ error: 'Internal Worker Error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function handleOptions(request) {
  let headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    let respHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers'),
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, { headers: respHeaders });
  } else {
    return new Response(null, { headers: { Allow: 'GET, POST, OPTIONS' } });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
