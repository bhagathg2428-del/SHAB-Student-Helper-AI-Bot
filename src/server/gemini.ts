import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment!');
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
}

export interface ChatMessageParam {
  role: 'user' | 'model';
  content: string;
}

export async function askSHABChat({
  message,
  history = [],
  documentContext = '',
  language = 'en',
}: {
  message: string;
  history?: ChatMessageParam[];
  documentContext?: string;
  language?: string;
}): Promise<string> {
  const ai = getAI();

  let languageInstruction = 'Respond in English.';
  if (language === 'te' || language === 'Telugu') {
    languageInstruction = 'Respond fluently and naturally in Telugu (తెలుగు). Use clear Telugu script with technical terms where appropriate.';
  } else if (language === 'hi' || language === 'Hindi') {
    languageInstruction = 'Respond fluently and naturally in Hindi (हिन्दी). Use clear Devanagari script with technical terms where appropriate.';
  }

  const systemInstruction = `You are SHAB (Student Helper AI Bot), an expert college study tutor and academic assistant.
Your goal is to help college students understand difficult academic topics (Computer Science, Engineering, Mathematics, Sciences, Management, etc.).

CRITICAL INSTRUCTIONS & FORMATTING RULES:
1. Always format responses in clean, beautifully structured Markdown:
   - Use proper markdown headings (# Title, ## Section, ### Sub-section)
   - Bold key terms (**term**)
   - Use numbered lists (1. 2. 3.) and bullet points (- item)
   - Use Markdown comparison tables for differences and comparisons
   - Use code blocks with language tags for programming questions (\`\`\`python, \`\`\`java, \`\`\`sql)
   - Use blockquotes for definitions or important warnings (> Note:)
   - Never output raw unformatted text or broken markdown syntax.

2. EXAM ANSWER FORMAT COMPLIANCE:
   - If the user asks for "2 marks": Provide a short, precise definition and direct 2-3 sentence answer.
   - If the user asks for "5 marks": Provide Title, Definition, Detailed Explanation, Key Points, Concrete Example, and Short Conclusion.
   - If the user asks for "10 marks": Provide Title, Formal Definition, Introduction, Detailed Core Explanation, Numbered Key Concepts, Concrete Examples, Advantages/Disadvantages (if applicable), and Conclusion.
   - If the user asks "Explain in 5 points": Provide EXACTLY 5 numbered points, each with a bold heading and brief explanation.
   - If the user asks "Difference between X and Y": Provide a clean Markdown table comparing parameters (Parameter, X, Y) followed by key takeaways.
   - If the user asks "Advantages and disadvantages": Provide two distinct sections with bulleted items.
   - If the user asks "Types of X": Provide a numbered list of types with definitions.
   - If the user asks "Steps": Provide numbered sequential steps.

3. DOCUMENT CONTEXT:
${documentContext ? `THE USER HAS PROVIDED THE FOLLOWING DOCUMENT CONTEXT:\n"""\n${documentContext.slice(0, 10000)}\n"""\nAnswer questions strictly and accurately based on the document content without hallucinating facts. If the document does not contain the answer, mention this clearly while providing helpful academic guidance.` : 'No specific document attached.'}

4. LANGUAGE:
${languageInstruction}

Be motivating, academically rigorous, crystal-clear, and student-focused.`;

  const contents: any[] = [];

  // Add recent history up to 10 messages
  const recentHistory = history.slice(-10);
  for (const item of recentHistory) {
    contents.push({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return response.text || 'I apologize, but I could not generate a response. Please try asking again.';
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    throw new Error('AI service is temporarily unavailable. Please try again.');
  }
}

export async function generateSummaryWithAI({
  text,
  summaryType = 'quick',
  answerLength = '5_marks',
  language = 'en',
}: {
  text: string;
  summaryType?: string;
  answerLength?: string;
  language?: string;
}): Promise<string> {
  const ai = getAI();

  let lengthGuidance = 'Medium length summary with essential key points.';
  if (answerLength === '2_marks' || answerLength === '2 Marks') {
    lengthGuidance = 'Exam 2-Marks Format: Crisp definition and 2 to 3 key summary points.';
  } else if (answerLength === '5_marks' || answerLength === '5 Marks') {
    lengthGuidance = 'Exam 5-Marks Format: Introduction/definition, 4-6 detailed bullet points, core concepts, and brief conclusion.';
  } else if (answerLength === '10_marks' || answerLength === '10 Marks') {
    lengthGuidance = 'Exam 10-Marks Format: Comprehensive academic breakdown with Title, Overview, In-depth Section Explanations, Key Highlights, Real-world Application/Examples, and Conclusion.';
  }

  let typeGuidance = 'Summarize key concepts clearly.';
  if (summaryType === 'quick') {
    typeGuidance = 'Provide a fast, high-impact overview highlighting the most vital ideas.';
  } else if (summaryType === 'detailed') {
    typeGuidance = 'Provide a thorough, comprehensive study summary covering all sections, definitions, and technical details.';
  } else if (summaryType === 'important_points') {
    typeGuidance = 'Extract strictly the high-yield Exam Important Points and formulas/principles in a numbered list.';
  }

  let langInstruction = 'Write the summary in English.';
  if (language === 'te') langInstruction = 'Write the summary in fluent Telugu (తెలుగు).';
  if (language === 'hi') langInstruction = 'Write the summary in fluent Hindi (हिन्दी).';

  const systemInstruction = `You are SHAB, an academic summarization engine for college students.
Produce structured, high-value revision notes and summaries using clean Markdown headings, bold keywords, and bullet points.
Guidelines:
- Type: ${typeGuidance}
- Target Depth: ${lengthGuidance}
- Language: ${langInstruction}
Avoid filler words. Emphasize exam-worthy concepts and definitions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Please summarize the following material:\n\n${text.slice(0, 15000)}` }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return response.text || 'Unable to generate summary at this time.';
  } catch (err: any) {
    console.error('Gemini summary error:', err);
    throw new Error('AI service is temporarily unavailable. Please try again.');
  }
}

export async function generateQuizWithAI({
  topic,
  documentText = '',
  numQuestions = 5,
  difficulty = 'Medium',
  language = 'en',
}: {
  topic: string;
  documentText?: string;
  numQuestions?: number;
  difficulty?: string;
  language?: string;
}) {
  const ai = getAI();

  const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 15);
  let langNote = 'Questions and explanations should be in English.';
  if (language === 'te') langNote = 'Questions, options, and explanations must be in Telugu (తెలుగు).';
  if (language === 'hi') langNote = 'Questions, options, and explanations must be in Hindi (हिन्दी).';

  const prompt = `Generate exactly ${count} multiple-choice questions (MCQs) for college students.
Topic: "${topic}"
Difficulty Level: ${difficulty}
${documentText ? `Based on this document content:\n${documentText.slice(0, 12000)}\n` : ''}
${langNote}

You must return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "id": 1,
    "question": "Clear academic question text?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect."
  }
]
Return RAW JSON only. Do not wrap in markdown code blocks like \`\`\`json.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const raw = response.text || '[]';
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error('Gemini quiz error:', err);
    throw new Error('AI quiz generation failed. Please try again.');
  }
}

export async function extractTextWithOCR({
  imageBase64,
  mimeType = 'image/png',
}: {
  imageBase64: string;
  mimeType?: string;
}): Promise<string> {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: 'Perform high-accuracy optical character recognition (OCR) on this image. Extract all text, equations, tables, code snippets, notes, and diagrams verbatim. Preserve layout, headings, and formatting using clean Markdown.',
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
    });

    return response.text || 'No readable text was detected in the image.';
  } catch (err: any) {
    console.error('Gemini OCR error:', err);
    throw new Error('OCR text extraction failed. Please ensure the image is clear and try again.');
  }
}
