import Anthropic from '@anthropic-ai/sdk';

// Export questions array so it can be imported and tested elsewhere
export const questions = [
  {
    text: "Apabila Yang di-Pertuan Agong melantik Perdana Menteri, baginda hendaklah memilih seorang ahli Dewan Rakyat yang boleh mendapat sokongan majoriti dan ia mestilah seorang yang",
    options: [
      "Beragama Islam",
      "Keturunan Melayu", 
      "Pernah menjadi Menteri Kabinet",
      "Menjadi warganegara mengikut operasi undang-undang"
    ],
    correctAnswer: 3
  },
  {
    text: "Deklarasi Kuala Lumpur 1971 ialah satu persetujuan mengenai",
    options: [
      "Penubuhan ASEAN",
      "Penubuhan pasaran bersama untuk ASEAN",
      "Pakatan ketenteraan di antara negara-negara ASEAN",
      "Penubuhan kawasan aman, bebas dan berkecuali di Asia Tenggara"
    ],
    correctAnswer: 3
  },
  {
    text: "Perlembagaan Persekutuan memperuntukkan bahawa bahasa kebangsaan Malaysia ialah",
    options: [
      "Bahasa Malaysia",
      "Bahasa Melayu",
      "Bahasa Kebangsaan",
      "Bahasa Rasmi"
    ],
    correctAnswer: 1
  },
  {
    text: "Sistem federalisme di Malaysia bermaksud",
    options: [
      "Kuasa pemerintahan dibahagikan antara kerajaan persekutuan dengan kerajaan negeri",
      "Kuasa pemerintahan terletak sepenuhnya pada kerajaan persekutuan",
      "Kuasa pemerintahan terletak sepenuhnya pada kerajaan negeri",
      "Kuasa pemerintahan dibahagikan antara eksekutif, legislatif dan kehakiman"
    ],
    correctAnswer: 0
  },
  {
    text: "Yang di-Pertuan Agong dilantik oleh",
    options: [
      "Perdana Menteri",
      "Majlis Raja-Raja",
      "Parlimen",
      "Rakyat melalui pilihanraya"
    ],
    correctAnswer: 1
  },
  {
    text: "Rukun Negara diisytiharkan pada tahun",
    options: [
      "1957",
      "1963",
      "1970",
      "1971"
    ],
    correctAnswer: 2
  },
  {
    text: "Dasar Ekonomi Baru (DEB) dilaksanakan untuk tempoh",
    options: [
      "10 tahun",
      "15 tahun",
      "20 tahun",
      "25 tahun"
    ],
    correctAnswer: 2
  },
  {
    text: "Perjanjian Malaysia 1963 melibatkan penggabungan",
    options: [
      "Tanah Melayu, Singapura, Sabah dan Sarawak",
      "Tanah Melayu, Sabah dan Sarawak",
      "Tanah Melayu dan Singapura sahaja",
      "Tanah Melayu, Singapura dan Brunei"
    ],
    correctAnswer: 0
  },
  {
    text: "Mahkamah Persekutuan merupakan",
    options: [
      "Mahkamah terendah di Malaysia",
      "Mahkamah tertinggi di Malaysia",
      "Mahkamah rayuan terakhir",
      "Mahkamah khas untuk kes-kes persekutuan"
    ],
    correctAnswer: 1
  },
  {
    text: "Dewan Negara dianggotai oleh",
    options: [
      "Wakil rakyat yang dipilih melalui pilihanraya",
      "Senator yang dilantik oleh Yang di-Pertuan Agong",
      "Wakil dari setiap negeri",
      "Ahli yang dilantik oleh Perdana Menteri"
    ],
    correctAnswer: 1
  }
];

// Add a new function to test questions directly
export const testQuestion = async (
  question: string, 
  options: string[], 
  selectedText: string, 
  apiKey: string
): Promise<string> => {
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
        content: `Here is a question and its options:

Question: ${question}
Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Here is the EXACT text that was selected: "${selectedText}"

Instructions:
1. IMPORTANT: Only analyze the exact text that was selected. Do not try to infer or look at surrounding context.
2. Compare this selected text directly with the question and its options.
3. Determine which option (A/B/C/D) best answers the specific question based solely on the selected text.

Format your response exactly like this:
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

export const processExtractedText = async (text: string): Promise<string> => {
  const apiKey = localStorage.getItem('ANTHROPIC_API_KEY');
  
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
