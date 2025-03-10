// Test script for the Cloudflare worker connection to Anthropic API

async function testCloudflareWorker() {
    console.log("Testing connection to Cloudflare worker...");

    // Using the correct worker URL found in cloudflare-worker/test.js
    const workerUrl = "https://anthropic-proxy.ariefroseli.workers.dev";

    console.log(`Attempting to connect to: ${workerUrl}`);

    try {
        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log("❌ Request timed out after 10 seconds");
        }, 10000);

        const response = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: "Hello, can you hear me? This is a test message."
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("Response status:", response.status);

        const text = await response.text();
        console.log("Response text:", text);

        try {
            const data = JSON.parse(text);
            console.log("Response data:", JSON.stringify(data, null, 2));

            if (data.content && data.content[0] && data.content[0].text) {
                console.log("AI response:", data.content[0].text);
                console.log("✅ Test successful! The Cloudflare worker is properly connected to Anthropic API.");
            } else if (data.error) {
                console.log("❌ Test failed: Error from API:", data.error);

                if (data.details) {
                    console.log("Error details:", data.details);
                }

                if (data.errorCode) {
                    console.log("Error code:", data.errorCode);

                    // Provide guidance based on error code
                    if (data.errorCode === "520") {
                        console.log("\nTroubleshooting for error 520 (Unknown Error):");
                        console.log("1. Check if the Anthropic API key is correctly set in the Cloudflare worker");
                        console.log("2. Verify that the Cloudflare worker is deployed correctly");
                        console.log("3. Check if there are any issues with the Anthropic API service");
                        console.log("4. Try deploying the worker again with 'npx wrangler deploy'");
                    }
                }
            } else {
                console.log("❌ Test failed: Unexpected response format.");
            }
        } catch (e) {
            console.log("❌ Could not parse response as JSON:", e.message);

            // Check for common error patterns in the raw response
            if (text.includes("error code: 520")) {
                console.log("\nTroubleshooting for error 520 (Unknown Error):");
                console.log("1. Check if the Anthropic API key is correctly set in the Cloudflare worker");
                console.log("2. Verify that the Cloudflare worker is deployed correctly");
                console.log("3. Check if there are any issues with the Anthropic API service");
                console.log("4. Try deploying the worker again with 'npx wrangler deploy'");
            } else if (text.includes("error code: 1101")) {
                console.log("\nTroubleshooting for error 1101 (Worker Exceeded CPU Time):");
                console.log("1. The worker is taking too long to process the request");
                console.log("2. Try simplifying the worker code or optimizing it");
            }
        }
    } catch (error) {
        console.error("❌ Error testing Cloudflare worker:", error.message);

        if (error.name === "AbortError") {
            console.log("\nTroubleshooting for timeout errors:");
            console.log("1. Check if the Cloudflare worker is deployed and running");
            console.log("2. Verify that the worker URL is correct");
            console.log("3. Check if there are any network issues");
        } else {
            console.log("\nTroubleshooting steps:");
            console.log("1. Check if the Cloudflare worker is deployed and running");
            console.log("2. Verify that the worker URL is correct");
            console.log("3. Check if CORS is properly configured in the worker");
            console.log("4. Try deploying the worker again with 'npx wrangler deploy'");
        }
    }
}

// Run the test
testCloudflareWorker(); 