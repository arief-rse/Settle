// Test script for the Cloudflare Worker
async function testWorker() {
    try {
        console.log("Testing worker...");
        const response = await fetch("https://anthropic-proxy.ariefroseli.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
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
        console.error("Error testing worker:", error);
    }
}

testWorker(); 