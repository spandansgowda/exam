import Groq from 'groq-sdk';

// Lazy Groq client helper
export function getGroqClient(): Groq | null {
  const apiKey = import.meta.env?.VITE_GROQ_API_KEY || (typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : '');
  if (!apiKey || apiKey.includes('YOUR_GROQ_API_KEY')) {
    return null;
  }
  return new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Generate practice MCQs using Groq AI (Llama 3.3 70B)
 */
export async function generateMCQsWithGroq(topic: string, subtopic?: string, difficulty = 'medium', count = 5) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in .env file.');
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert exam question generator. You MUST respond with ONLY a raw JSON object matching the requested schema without any markdown wrapping or backticks.',
      },
      {
        role: 'user',
        content: `Generate ${count} high-quality MCQs on Topic: "${topic}", Subtopic: "${subtopic || 'General'}", Difficulty: "${difficulty}".
Format strictly as JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "exact string match of correct option",
      "explanation": "concise explanation",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "subtopic": "${subtopic || ''}"
    }
  ]
}`,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  const text = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(text);
}
