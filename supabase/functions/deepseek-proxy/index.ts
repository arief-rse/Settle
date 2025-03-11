// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Validate required environment variables
const requiredEnvVars = {
  DEEPSEEK_API_KEY: Deno.env.get('DEEPSEEK_API_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const DEEPSEEK_API_KEY = requiredEnvVars.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const SUPABASE_URL = requiredEnvVars.URL;
const SUPABASE_SERVICE_ROLE_KEY = requiredEnvVars.SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(
  URL,
  SERVICE_ROLE_KEY
);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    // Try to access the deepseek_logs table
    const { data, error } = await supabase
      .from('deepseek_logs')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      throw new Error(`Supabase connection test failed: ${error.message}`);
    }

    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Failed to test Supabase connection:', error);
    throw error;
  }
}

// Test connection on startup
await testSupabaseConnection();

async function logApiCall(userId: string, requestData: any, responseData: any, status: string) {
  try {
    const { data, error } = await supabase
      .from('deepseek_logs')
      .insert([
        {
          user_id: userId,
          request_type: 'chat',
          tokens_used: responseData.usage?.total_tokens || 0,
          status: status,
          model: requestData.model,
          cost: calculateCost(responseData.usage?.total_tokens || 0, requestData.model),
          created_at: new Date().toISOString()
        }
      ])
      .select(); // Add this to get the inserted record

    if (error) {
      console.error('Error logging API call:', error);
      throw error;
    }

    console.log('API call logged successfully:', data);
  } catch (error) {
    console.error('Failed to log API call:', error);
    throw error;
  }
}

function calculateCost(tokens: number, model: string): number {
  // Add your cost calculation logic here
  const rates: Record<string, number> = {
    'deepseek-chat': 0.002, // $0.002 per 1K tokens
    'deepseek-code': 0.003  // $0.003 per 1K tokens for code model
  };
  
  const rate = rates[model] || rates['deepseek-chat'];
  return (tokens / 1000) * rate;
}

console.log("DeepSeek Proxy Function initialized successfully!");

serve(async (req) => {
  // Add test endpoint
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/test')) {
    try {
      // Test Supabase connection
      await testSupabaseConnection();
      
      // Test environment variables
      const envStatus = {
        DEEPSEEK_API_KEY: !!DEEPSEEK_API_KEY,
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
      };

      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Edge Function is working correctly',
        timestamp: new Date().toISOString(),
        environment: envStatus,
        supabase: 'connected'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  // Only allow POST requests for the main endpoint
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Verify authentication
    const userId = req.headers.get('X-User-ID');
    if (!userId) {
      console.error('Unauthorized request: Missing X-User-ID header');
      return new Response('Unauthorized: Missing user ID', { status: 401 });
    }

    // Get and validate request body
    const body = await req.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      console.error('Invalid request body: Missing or invalid messages array');
      return new Response('Invalid request: Missing messages array', { status: 400 });
    }

    console.log(`Processing request for user ${userId}`);

    // Forward request to DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('DeepSeek API error:', data);
      await logApiCall(userId, body, { error: data }, 'error');
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    // Log successful API call
    await logApiCall(userId, body, data, 'success');
    console.log(`Request processed successfully for user ${userId}`);

    // Return the DeepSeek API response
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Log the error
    if (req.headers.get('X-User-ID')) {
      try {
        await logApiCall(
          req.headers.get('X-User-ID')!,
          await req.json().catch(() => ({})),
          { error: error.message },
          'error'
        );
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Internal server error occurred'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deepseek-proxy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
