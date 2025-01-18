import { Anthropic } from '@anthropic-ai/sdk';

interface Question {
  text: string;
  options: string[];
}

const questions: Question[] = [
  {
    text: "What is the main idea or central theme of the passage?",
    options: [
      "Main idea or theme A",
      "Main idea or theme B",
      "Main idea or theme C",
      "Main idea or theme D"
    ]
  },
  // Add more questions as needed
];

export const processExtractedText = async (text: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is missing');
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Here are the questions and their options:

${questions.map((q, index) => `
Question ${index + 1}: ${q.text}
Options:
${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.replace(/^[A-D]\.\s*/, '')}`).join('\n')}
`).join('\n')}

Here is the EXACT text that was selected: "${text}"

Instructions:
1. IMPORTANT: Only analyze the exact text that was selected. Do not try to infer or look at surrounding context.
2. Compare this selected text directly with each question and its options to find which question it most closely matches.
3. Once you've identified the matching question, determine which option (A/B/C/D) best answers that specific question based solely on the selected text.

Format your response exactly like this:
Question Number: [1-10]
Answer: [A/B/C/D]
Brief explanation: [1 short sentence explaining why]

Note: Only use the exact selected text for your analysis. Do not consider any text outside of what was selected.`
      }]
    });

    const content = message.content[0];
    if ('text' in content) {
      return content.text;
    }
    
    throw new Error('Unexpected response format from AI');
  } catch (error) {
    console.error('AI Processing error:', error);
    if (error instanceof Error) {
      throw new Error(`AI Processing failed: ${error.message}`);
    }
    throw new Error('AI Processing failed with an unknown error');
  }
};
