// Test script for the Anthropic API
async function testAnthropicApi() {
    // Replace with your actual API key
    const apiKey = "sk-ant-api03-REPLACE-WITH-YOUR-ACTUAL-API-KEY";

    try {
        console.log("Testing Anthropic API...");
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-opus-20240229",
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: "Hello, world!"
                    }
                ]
            })
        });

        console.log("Response status:", response.status);

        const text = await response.text();
        console.log("Response text:", text);

        try {
            const data = JSON.parse(text);
            console.log("Response data:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Could not parse response as JSON");
        }
    } catch (error) {
        console.error("Error testing API:", error);
    }
}

testAnthropicApi(); 