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
  const safeTopic = (topic || '').trim().slice(0, 200);
  const safeSubtopic = (subtopic || 'General').trim().slice(0, 200);

  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in .env file.');
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam question generator. Output ONLY a valid raw JSON object matching the requested schema.',
        },
        {
          role: 'user',
          content: `Generate ${Math.min(10, Math.max(1, count))} high-quality MCQs on Topic: "${safeTopic}", Subtopic: "${safeSubtopic}", Difficulty: "${difficulty}".
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
      "topic": "${safeTopic}",
      "subtopic": "${safeSubtopic}"
    }
  ]
}`,
        },
      ],
      model: 'groq/compound',
    });

    const text = completion.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(text);
    } catch (e) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) return JSON.parse(match[1].trim());
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) return JSON.parse(objMatch[0]);
      return { questions: [] };
    }
  } catch (err: any) {
    console.warn('Direct Groq API client call failed, falling back to server route:', err?.message || err);
    const res = await fetch('/api/practice/generate-mcq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: safeTopic, subtopic: safeSubtopic, difficulty, count }),
    });
    return await res.json();
  }
}
