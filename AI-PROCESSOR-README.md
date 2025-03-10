# Simple AI Processor for Text Analysis

This document provides instructions on setting up and using the simplified AI processor for text analysis in the Chrome extension.

## Overview

The AI processor analyzes text extracted from web pages and provides helpful responses to user queries. It's designed to be straightforward and reliable.

### Features

- **Simple DeepSeek integration**: Uses DeepSeek's powerful language models for text analysis
- **Offline mode**: Falls back to local processing when API is unavailable
- **Question detection**: Automatically detects if the text is a question
- **Error handling**: Gracefully handles API errors

## Setup Instructions

### API Key Setup

The AI processor requires a DeepSeek API key to function online:

1. Get an API key from [DeepSeek Platform](https://platform.deepseek.com/)
2. Create a `.env` file in the project root (or copy from `.env.example`)
3. Add your DeepSeek API key:
   ```
   VITE_DEEPSEEK_API_KEY="your-deepseek-api-key-here"
   ```

### Testing the Connection

After setting up your API key, test the connection:

```
pnpm run test-deepseek
```

## Usage

The AI processor is used in the `ResponsePanel` component to analyze text extracted from web pages:

```typescript
import { processExtractedText } from "../../../lib/ai-processor";

// Later in your component
const result = await processExtractedText(extractedText);
```

## Offline Mode

If the DeepSeek API is unavailable or no API key is provided, the processor will fall back to local processing:

- For questions: Provides a generic response indicating offline mode
- For text analysis: Provides basic statistics and a simple summary

The UI will display an "Offline Mode" indicator when operating in this mode.

## Customization

### Changing the AI Model

You can modify the AI model used by editing the `src/lib/ai-processor.ts` file:

```typescript
// Change this line to use a different model
model: "deepseek-chat",
```

DeepSeek offers several models you can use:
- `deepseek-chat`: General-purpose chat model
- `deepseek-coder`: Specialized for code-related tasks
- `deepseek-lite`: Lighter, faster model for simpler tasks

### Adjusting Prompts

You can customize the prompts sent to the AI service by modifying the `prompt` variable in the `processExtractedText` function.

### Adjusting Temperature

You can control the creativity vs. determinism of responses by adjusting the temperature parameter:

```typescript
// Higher values (e.g., 0.8) make responses more creative
// Lower values (e.g., 0.2) make responses more deterministic
temperature: 0.7
```

## Troubleshooting

### API Connection Issues

If you're experiencing issues connecting to the DeepSeek API:

1. Check that your API key is valid and correctly set in the `.env` file
2. Verify that you have billing set up in your DeepSeek account
3. Check the browser console for specific error messages

### Offline Mode Always Active

If the extension is always in offline mode:

1. Make sure your API key is correctly set in the `.env` file
2. Check that the environment variables are being loaded correctly
3. Verify that your DeepSeek account is active and has available credits 