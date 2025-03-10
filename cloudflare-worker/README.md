# Anthropic API Proxy

This is a Cloudflare Worker that securely proxies requests to the Anthropic API. It keeps your API key secure by storing it as an environment variable in Cloudflare.

## Deployment Instructions

### Prerequisites
- A Cloudflare account
- An Anthropic API key

### Steps to Deploy

1. Install dependencies:
   ```
   pnpm install
   ```

2. Login to Cloudflare via Wrangler:
   ```
   pnpm exec wrangler login
   ```

3. Deploy the worker:
   ```
   pnpm run deploy
   ```

4. Set your Anthropic API key as a secret:
   ```
   pnpm run secret
   ```
   When prompted, enter your Anthropic API key.

5. Your worker is now deployed! The URL will be shown in the terminal after deployment.

## Usage in Your Extension

Update your AI processor to use the worker instead of calling Anthropic directly:

```javascript
export const processExtractedText = async (text: string): Promise<string> => {
  try {
    const response = await fetch('https://your-worker-url.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Your prompt here with ${text}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('AI Processing error:', error);
    throw new Error(`AI Processing failed: ${error.message}`);
  }
};
```

## Security Benefits

- Your Anthropic API key is stored securely in Cloudflare's environment variables
- The key is never exposed to client-side code
- You can implement rate limiting and other security measures in the worker
- Requests are proxied through Cloudflare's global network 