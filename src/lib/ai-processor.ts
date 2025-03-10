// Simple AI Processor Implementation using DeepSeek API via Cloudflare Worker

/**
 * Process the extracted text and return an analysis
 * @param text The text to analyze
 * @returns A promise that resolves to the analysis result
 */
export const processExtractedText = async (text: string): Promise<string> => {
  try {
    // Determine if the text is a question
    const isQuestion = text.trim().endsWith('?') || 
                      /^(what|who|when|where|why|how)\b/i.test(text.trim());
    
    // Create a simple prompt
    const prompt = isQuestion 
      ? `Answer this question clearly and concisely: ${text}`
      : `Analyze this text and provide a helpful summary: ${text}`;
    
    // Try to use DeepSeek API via Cloudflare Worker
    try {
      console.log("Using DeepSeek API via Cloudflare Worker...");
      
      // Replace this with your actual Cloudflare worker URL
      const workerUrl = "https://deepseek-proxy.your-subdomain.workers.dev";
      
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat", // DeepSeek's chat model
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides clear, concise responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1024,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content as string;
        }
      }
      
      throw new Error("Failed to get response from DeepSeek via Cloudflare Worker");
    } catch (error) {
      console.warn("DeepSeek API error, falling back to local processing:", error);
    }
    
    // Fallback: Local processing
    console.log("Using local processing...");
    
    if (isQuestion) {
      return `I received your question: "${text}"

I'm currently operating in offline mode and can't provide a specific answer. 
Please check your internet connection or API key configuration.`;
    } else {
      // Simple text analysis
      const wordCount = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const sentenceCount = sentences.length;
      
      // Extract some key phrases (simple approach)
      const words = text.toLowerCase().split(/\s+/);
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'from']);
      const significantWords = words.filter(word => word.length > 3 && !commonWords.has(word));
      
      // Count word frequency
      const wordFrequency: Record<string, number> = {};
      significantWords.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
      
      // Get top 5 most frequent words
      const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
      
      // First sentence as intro
      const intro = sentences[0] ? sentences[0].trim() : '';
      
      return `Analysis of the provided text:

Text Statistics:
- Word count: ${wordCount}
- Sentence count: ${sentenceCount}
- Key terms: ${topWords.join(', ')}

Summary:
${intro}

Note: This is a simplified analysis generated in offline mode.`;
    }
  } catch (error) {
    console.error("Error processing text:", error);
    return "Sorry, I couldn't process your text. Please try again later.";
  }
};
