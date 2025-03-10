// Test script for the DeepSeek API connection
import 'dotenv/config'; // Load environment variables from .env file

async function testDeepSeekApi() {
    console.log("Testing connection to DeepSeek API...");

    // Get the API key from environment variables
    const apiKey = process.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.error("❌ DeepSeek API key not found in environment variables.");
        console.log("Please add your DeepSeek API key to the .env file as VITE_DEEPSEEK_API_KEY.");
        return;
    }

    console.log("API key found in environment variables.");

    try {
        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log("❌ Request timed out after 10 seconds");
        }, 10000);

        console.log("Sending request to DeepSeek API...");

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that provides clear, concise responses."
                    },
                    {
                        role: "user",
                        content: "Hello, can you hear me? This is a test message."
                    }
                ],
                max_tokens: 1024,
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("Response status:", response.status);

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            console.log("Response data:", JSON.stringify(data, null, 2));

            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                console.log("AI response:", data.choices[0].message.content);
                console.log("✅ Test successful! DeepSeek API is working correctly.");
            } else if (data.error) {
                console.log("❌ Test failed: Error from API:", data.error.message);
                console.log("Error type:", data.error.type);

                // Provide guidance based on error type
                if (data.error.type === "invalid_request_error") {
                    console.log("\nTroubleshooting for invalid request errors:");
                    console.log("1. Check if your API key has the correct permissions");
                    console.log("2. Verify that you're using a supported model");
                    console.log("3. Make sure your request format is correct");
                } else if (data.error.type === "authentication_error") {
                    console.log("\nTroubleshooting for authentication errors:");
                    console.log("1. Check if your API key is correct");
                    console.log("2. Verify that your API key is active");
                    console.log("3. Make sure you have billing set up in your DeepSeek account");
                } else if (data.error.type === "rate_limit_error") {
                    console.log("\nTroubleshooting for rate limit errors:");
                    console.log("1. Reduce the frequency of your requests");
                    console.log("2. Consider upgrading your DeepSeek plan");
                }
            } else {
                console.log("❌ Test failed: Unexpected response format.");
            }
        } catch (e) {
            console.log("❌ Could not parse response as JSON:", e.message);
            console.log("Raw response:", text);
        }
    } catch (error) {
        console.error("❌ Error testing DeepSeek API:", error.message);

        if (error.name === "AbortError") {
            console.log("\nTroubleshooting for timeout errors:");
            console.log("1. Check your internet connection");
            console.log("2. The DeepSeek API might be experiencing high traffic");
            console.log("3. Try again later");
        } else {
            console.log("\nTroubleshooting steps:");
            console.log("1. Check if your API key is correct");
            console.log("2. Verify that you have billing set up in your DeepSeek account");
            console.log("3. Make sure you're not behind a firewall that blocks the DeepSeek API");
        }
    }
}

// Run the test
testDeepSeekApi(); 