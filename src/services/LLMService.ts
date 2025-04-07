
export interface LLMResponse {
  move: string;
  message: string;
}

class LLMService {
  async getMove(
    provider: string,
    apiKey: string,
    fen: string,
    moveHistory: string[] = [],
    isFeedback?: boolean,
    prevMove?: string
  ): Promise<{ move: string }> {
    if (provider === 'Google Gemini') {
      console.log("Using Google Gemini API for move generation.");
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      let prompt = `
        Analyze the chess position given in the FEN string: "${fen}".
        Move History: ${moveHistory.join(', ')}
        Suggest a valid chess move in Universal Chess Interface (UCI) format (e.g., 'e2e4', 'g8f6'). 
        Do not use algebraic notation.
        Output should be exactly: ANSWER: <4-character move>
        `;
      if (isFeedback) {
        prompt += `
          The previous move "${prevMove}" was invalid.
          Ensure that the suggested move follows all chess rules and is legal.
          `;
      }
      
      const payload = {
        contents: [
          { parts: [{ text: prompt }] }
        ]
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Gemini API raw response:", data);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const moveMatch = rawText.match(/ANSWER:\s*([a-h][1-8][a-h][1-8])/i);
      if (!moveMatch) {
        console.warn(`Invalid move format received: "${rawText}"`);
        throw new Error('LLM repeatedly returned invalid moves. Stopping retries.');
      }
      return { move: moveMatch[1] };
    } else {
      const prompt = `
        Given the chess board position in FEN "${fen}" and the move history: ${moveHistory.join(', ')}, suggest a valid chess move in UCI format.
        `;
      const endpoint = provider === 'OpenAI GPT'
        ? 'https://api.openai.com/v1/engines/davinci-codex/completions'
        : 'https://api.cohere.ai/generate';
      
      const payload = {
        prompt,
        max_tokens: 10,
        temperature: 0.5,
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { move: data.move || data.choices[0]?.text.trim() || '' };
    }
  }

  async getConversationMove(
    provider: string,
    apiKey: string,
    fen: string,
    moveHistory: string[] = [],
    conversationContext: string,
    includeAnswerFormat: boolean = false
  ): Promise<LLMResponse> {
    // Add the answer instruction only for non-initial exchanges.
    const answerInstruction = includeAnswerFormat
      ? `\nONLY when you are completely aligned with your partner, Output your final agreed move in the exact format:
      ANSWER: <4-character move> Do not include any additional text answer should be in strictly UCI format.
      If answer is e5, output should be: ANSWER: e7e5. Do not use algebraic notation.
      `
      : ``;
    
    const prompt = `
    You are engaged in a collaborative conversation with another advanced chess analysis AI.
    FEN: ${fen}

    Move History:
    ${moveHistory.join(', ')}

    Conversation so far:
    ${conversationContext}

    ${answerInstruction}

    Provide your detailed reasoning, analysis, and (when appropriate) your final move suggestion.
    `;

    const endpoint =
      provider === 'Google Gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
        : 'https://api.example.com/llm';

    const payload = {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const answerMatch = includeAnswerFormat ? rawText.match(/ANSWER:\s*([a-h][1-8][a-h][1-8])/i) : null;
    const move = answerMatch ? answerMatch[1] : '';
    
    return { move, message: rawText.trim() };
  }
}

export default new LLMService();
