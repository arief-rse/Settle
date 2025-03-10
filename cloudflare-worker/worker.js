// Cloudflare Worker script to proxy requests to Anthropic API
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
        return handleCORS(request)
    }

    // Only allow POST requests
    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 })
    }

    try {
        // Get the request body
        let requestData;
        try {
            requestData = await request.json();
        } catch (error) {
            console.error("Error parsing request JSON:", error.message);
            return new Response(JSON.stringify({
                error: "Invalid JSON in request body",
                details: error.message
            }), {
                status: 400,
                headers: corsHeaders
            });
        }

        console.log("Request data:", JSON.stringify(requestData));

        // Check if API key is available
        if (!ANTHROPIC_API_KEY) {
            console.error("API key is missing");
            return new Response(JSON.stringify({ error: "API key is missing" }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Validate required fields in the request
        if (!requestData.model) {
            return new Response(JSON.stringify({ error: "Missing required field: model" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        if (!requestData.messages || !Array.isArray(requestData.messages) || requestData.messages.length === 0) {
            return new Response(JSON.stringify({ error: "Missing or invalid field: messages" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Create a new request to Anthropic
        const anthropicUrl = "https://api.anthropic.com/v1/messages";
        console.log("Making request to Anthropic API:", anthropicUrl);

        const headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        };

        console.log("Request headers:", JSON.stringify(headers));

        const fetchOptions = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestData)
        };

        // Forward the request to Anthropic with timeout
        let response;
        try {
            // Set a timeout for the fetch request (10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            response = await fetch(anthropicUrl, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
        } catch (error) {
            console.error("Error fetching from Anthropic API:", error.message);
            return new Response(JSON.stringify({
                error: "Failed to connect to Anthropic API",
                details: error.message
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        // Log response status for debugging
        console.log("Anthropic API response status:", response.status);

        // Get the response as text first for debugging
        let responseText;
        try {
            responseText = await response.text();
            console.log("Anthropic API response text:", responseText);
        } catch (error) {
            console.error("Error reading response text:", error.message);
            return new Response(JSON.stringify({
                error: "Failed to read response from Anthropic API",
                details: error.message
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        // Check if response text is empty
        if (!responseText || responseText.trim() === '') {
            console.error("Empty response from Anthropic API");
            return new Response(JSON.stringify({
                error: "Empty response from Anthropic API"
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        // Try to parse the response as JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (error) {
            console.error("Error parsing response as JSON:", error.message);

            // Try to extract error code if present
            const errorCodeMatch = responseText.match(/error code: (\d+)/);
            const errorCode = errorCodeMatch ? errorCodeMatch[1] : "unknown";

            return new Response(JSON.stringify({
                error: "Error parsing Anthropic API response",
                details: error.message,
                errorCode: errorCode,
                responseText: responseText.substring(0, 500) // Limit response text length
            }), {
                status: 502, // Changed from 500 to 502 to indicate gateway error
                headers: corsHeaders
            });
        }

        // If response is not ok, return the error
        if (!response.ok) {
            console.error("Anthropic API error:", JSON.stringify(responseData));
            return new Response(JSON.stringify({
                error: "Anthropic API error",
                status: response.status,
                details: responseData
            }), {
                status: response.status,
                headers: corsHeaders
            });
        }

        // Return the response with CORS headers
        return new Response(JSON.stringify(responseData), {
            headers: corsHeaders
        });
    } catch (error) {
        console.error("Worker error:", error.message, error.stack);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// Define CORS headers
const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key"
};

function handleCORS(request) {
    return new Response(null, {
        headers: corsHeaders
    });
} 