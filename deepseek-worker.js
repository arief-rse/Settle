// Cloudflare Worker script to proxy requests to DeepSeek API
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
        if (!DEEPSEEK_API_KEY) {
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

        // Create a new request to DeepSeek
        const deepseekUrl = "https://api.deepseek.com/v1/chat/completions";
        console.log("Making request to DeepSeek API:", deepseekUrl);

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        };

        console.log("Request headers:", JSON.stringify(headers));

        const fetchOptions = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestData)
        };

        // Forward the request to DeepSeek with timeout
        let response;
        try {
            // Set a timeout for the fetch request (10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            response = await fetch(deepseekUrl, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
        } catch (error) {
            console.error("Error fetching from DeepSeek API:", error.message);
            return new Response(JSON.stringify({
                error: "Failed to connect to DeepSeek API",
                details: error.message
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        // Log response status for debugging
        console.log("DeepSeek API response status:", response.status);

        // Get the response as text first for debugging
        let responseText;
        try {
            responseText = await response.text();
            console.log("DeepSeek API response text:", responseText);
        } catch (error) {
            console.error("Error reading response text:", error.message);
            return new Response(JSON.stringify({
                error: "Failed to read response from DeepSeek API",
                details: error.message
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        // Check if response text is empty
        if (!responseText || responseText.trim() === '') {
            console.error("Empty response from DeepSeek API");
            return new Response(JSON.stringify({
                error: "Empty response from DeepSeek API"
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
                error: "Error parsing DeepSeek API response",
                details: error.message,
                errorCode: errorCode,
                responseText: responseText.substring(0, 500) // Limit response text length
            }), {
                status: 502, // Gateway error
                headers: corsHeaders
            });
        }

        // If response is not ok, return the error
        if (!response.ok) {
            console.error("DeepSeek API error:", JSON.stringify(responseData));
            return new Response(JSON.stringify({
                error: "DeepSeek API error",
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function handleCORS(request) {
    return new Response(null, {
        headers: corsHeaders
    });
} 