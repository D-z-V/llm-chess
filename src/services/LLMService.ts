// src/services/LLMService.ts
export interface LLMResponse {
  move: string;
}

class LLMService {
  async getMove(
    provider: string, 
    apiKey: string, 
    fen: string, 
    isFeedback?: boolean, 
    prevMove?: string
  ): Promise<LLMResponse> {
    if (provider === 'Google Gemini') {

      console.log("Using Google Gemini API for move generation.");
      console.log(apiKey, fen, isFeedback, prevMove);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Adjust the prompt dynamically based on feedback
      let prompt = `
        Analyze the chess position given in the FEN string: "${fen}". 
        Suggest a valid chess move in Universal Chess Interface (UCI) format (e.g., 'e2e4', 'g8f6'). 
        Do not use algebraic notation (e.g., 'Nf6'). 
        Output should be 'ANSWER:' followed by exactly a 4-character move.
        Do not include any additional commentary.
      `;

      if (isFeedback) {
        prompt += `
        The previous move "${prevMove}" was invalid. 
        Ensure that the suggested move follows all chess rules and is legal. 
        Double-check en passant, castling, and piece legality.
        `;
      }

      const payload = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
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

      // Improved regex to extract UCI move
      const moveMatch = rawText.match(/ANSWER:\s*([a-h][1-8][a-h][1-8])/i);
      if (!moveMatch) {
        console.warn(`Invalid move format received: "${rawText}"`);

        throw new Error('LLM repeatedly returned invalid moves. Stopping retries.');
      }

      return { move: moveMatch[1] };
    } else {
      // For other providers, use the provided API key.
      let endpoint = '';
      switch (provider) {
        case 'OpenAI GPT':
          endpoint = 'https://api.openai.com/v1/engines/davinci-codex/completions';
          break;
        case 'Cohere':
          endpoint = 'https://api.cohere.ai/generate';
          break;
        default:
          throw new Error('Unsupported provider');
      }
      
      const payload = {
        prompt: `Given the chess board position in FEN "${fen}", suggest a valid chess move.`,
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
}

export default new LLMService();
