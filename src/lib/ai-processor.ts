import { Anthropic } from '@anthropic-ai/sdk';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages/messages';

interface Question {
  text: string;
  options: string[];
  source: 'text' | 'image' | 'both';
}


const questions: Question[] = [

  {
    source: 'text',
    text: "Which of the following is the correct combination of numbers and its product after rounded off to the nearest tens?",
    options: [
      "313 -> 310",
      "286 -> 280", 
      "859 -> 859",
      "758 -> 700"
    ]
  },
  {
    source: 'image',
    text: "What numerical values or calculations are shown in the image?",
    options: [
      "Numbers and their rounded values",
      "Mathematical equations",
      "Numerical sequences", 
      "Statistical data"
    ]
  },
  {
    source: 'both',
    text: "Based on both the text and image content, what is being presented?",
    options: [
      "Mathematical calculations and their results",
      "Numerical data with explanations",
      "Formulas with examples",
      "Statistical analysis with annotations"
    ]
  }
  // Add more questions as needed
];

interface SelectionCoordinates {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface ExtractedContent {
  text: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  coordinates?: SelectionCoordinates;
  query?: string;

}


export const processExtractedText = async (
  extractedContent: ExtractedContent,
  apiKey: string
): Promise<{ text: string; generatedImage?: string }> => {
  if (!apiKey) {
    throw new Error('API key is missing');
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    // Filter questions based on the content source
    const relevantQuestions = questions.filter(q => 
      q.source === extractedContent.source || q.source === 'both'
    );

    let contextPrompt = '';
    let content: any[] = [];

    // Add coordinates information to the context if available
    const coordinatesInfo = extractedContent.coordinates 
      ? `\nSelection coordinates: Left: ${extractedContent.coordinates.left}px, Top: ${extractedContent.coordinates.top}px, Right: ${extractedContent.coordinates.right}px, Bottom: ${extractedContent.coordinates.bottom}px`
      : '';

    switch (extractedContent.source) {
      case 'text':
        contextPrompt = `The following text was selected from the webpage${coordinatesInfo}:`;
        content = [{
          type: 'text',
          text: `${contextPrompt}\n"${extractedContent.text}"\n\n`
        }];
        break;
      
      case 'image':
        if (!extractedContent.imageData) {
          throw new Error('Image data is required for image analysis');
        }
        contextPrompt = 'Please analyze this image and the OCR text extracted from it:';
        content = [
          {
            type: 'text',
            text: `${contextPrompt}\n\nOCR Text extracted:\n"${extractedContent.text}"\n\n`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: extractedContent.imageData.replace(/^data:image\/\w+;base64,/, '')
            }
          }
        ];
        break;
      
      case 'both':
        if (!extractedContent.imageData) {
          throw new Error('Image data is required for combined analysis');
        }
        contextPrompt = 'Please analyze both this image and the surrounding webpage text:';
        content = [
          {
            type: 'text',
            text: `${contextPrompt}\n\nWebpage text:\n"${extractedContent.text}"\n\n`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: extractedContent.imageData.replace(/^data:image\/\w+;base64,/, '')
            }
          }
        ];
        break;
    }

    // Add questions to the content
    content.push({
      type: 'text',
      text: `Here are the relevant questions for this ${extractedContent.source} content:

${relevantQuestions.map((q, index) => `
Question ${index + 1}: ${q.text}
Options:
${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}
`).join('\n')}

Please analyze the content and answer these questions. Consider that:
1. For text content: Focus on the exact words and their meaning
2. For image content: Analyze both the visual content and any text shown in the image
3. For both: Consider the relationship between the visual elements and the text

Note: Only analyze the content provided. Do not make assumptions about content outside what was provided.`
    });

    // Add user query and request for visual response when appropriate
    content.push({
      type: 'text',
      text: `\nUser Question: ${extractedContent.query || 'Please analyze this content.'}\n\n` +
        `Please provide a detailed answer based on the content provided. If the question or analysis would benefit from a visual explanation, ` +
        `please generate an image to illustrate your response. Consider both the visual and textual elements in your analysis.\n\n` +
        `If you need to generate an image, please do so and include it in your response along with your text explanation.`
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content
      }]
    });

    let responseText = '';
    let generatedImage: string | undefined;
    // Process each content part from the response
    message.content.forEach((content: ContentBlock) => {
      if ('text' in content && content.text) {
        responseText += content.text;
      } else if ('image' in content && 'image' in content) {
        const imageContent = content.image as {
          source?: {
            type: string;
            media_type: string;
            data: string;
          }
        };
        if (imageContent.source?.type === 'base64') {
          generatedImage = `data:${imageContent.source.media_type};base64,${imageContent.source.data}`;
        }
      }

    });

    return {
      text: responseText,
      generatedImage
    };
  } catch (error) {
    console.error('AI Processing error:', error);
    if (error instanceof Error) {
      throw new Error(`AI Processing failed: ${error.message}`);
    }
    throw new Error('AI Processing failed with an unknown error');
  }
};
