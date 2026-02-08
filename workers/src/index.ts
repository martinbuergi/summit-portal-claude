/**
 * Summit Portal API - Cloudflare Workers Entry Point
 *
 * Main router for all API endpoints
 */

export interface Env {
  // Bindings
  DOCUMENTS: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;

  // Secrets
  DATABASE_URL: string;
  IMS_CLIENT_ID: string;
  IMS_CLIENT_SECRET: string;
  IMS_TOKEN_URL: string;
  ADOBE_ORG_ID: string;
  PRODUCTION_AGENT_API_URL: string;
  PRODUCTION_AGENT_API_KEY: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  JWT_SECRET: string;
  SESSION_EXPIRY_HOURS: string;
  MCP_RATE_LIMIT_PER_MINUTE: string;
  MCP_RATE_LIMIT_PER_DAY: string;

  // Variables
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Update with specific origins in production
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      // Route to appropriate handler
      let response: Response;

      if (path.startsWith('/auth/')) {
        const { handleAuthRoutes } = await import('./routes/auth');
        response = await handleAuthRoutes(request, env, ctx);
      } else if (path.startsWith('/users/')) {
        const { handleUserRoutes } = await import('./routes/users');
        response = await handleUserRoutes(request, env, ctx);
      } else if (path.startsWith('/companies/')) {
        const { handleCompanyRoutes } = await import('./routes/companies');
        response = await handleCompanyRoutes(request, env, ctx);
      } else if (path.startsWith('/activities/')) {
        const { handleActivityRoutes } = await import('./routes/activities');
        response = await handleActivityRoutes(request, env, ctx);
      } else if (path.startsWith('/mcp/')) {
        const { handleMcpRoutes } = await import('./routes/mcp');
        response = await handleMcpRoutes(request, env, ctx);
      } else {
        response = new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Endpoint not found',
            },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
