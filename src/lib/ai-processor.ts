import { Anthropic } from "@anthropic-ai/sdk";

export const processExtractedText = async (text: string): Promise<string> => {
  const apiKey = localStorage.getItem("ANTHROPIC_API_KEY");

  if (!apiKey) {
    throw new Error("API key is missing");
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Here is the text that was selected: "${text}"

Instructions:
1. IMPORTANT: Only analyze the exact text that was selected. Do not try to infer or look at surrounding context.
2. Analyze the text and provide a concise summary of its main points.
3. If there are any key insights or important details, highlight them.

Format your response in a clear, easy-to-read manner.`,
        },
      ],
    });

    const content = message.content[0];
    if ("text" in content) {
      return content.text;
    }

    throw new Error("Unexpected response format from AI");
  } catch (error) {
    console.error("AI Processing error:", error);
    if (error instanceof Error) {
      throw new Error(`AI Processing failed: ${error.message}`);
    }
    throw new Error("AI Processing failed with an unknown error");
  }
};
