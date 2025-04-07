import { useState, useEffect, useCallback, useRef } from 'react';
import ChessService from '../services/ChessService';
import LLMService from '../services/LLMService';

export interface GameState {
  gameId: string;
  fen: string;
  history: string[];
  status: string;
  turn: 'w' | 'b';
  mode: string;
  playerWhite: string;
  playerBlack: string;
  datePlayed: string;
  llmProvider?: string;
  llmApiKey?: string;
  thinkingMode?: boolean;
  llmProvider2?: string;
  llmApiKey2?: string;
}

const LOCAL_STORAGE_KEY = "chessSavedGames";

const getSavedGames = (): GameState[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveGameToLocalStorage = (game: GameState) => {
  const games = getSavedGames();
  const index = games.findIndex(g => g.gameId === game.gameId);
  if (index > -1) {
    games[index] = game;
  } else {
    games.push(game);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
};

const removeSavedGame = (gameId: string) => {
  const games = getSavedGames().filter(game => game.gameId !== gameId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
};

interface LLMOptions {
  provider: string;
  apiKey?: string;
  thinkingMode: boolean;
  provider2?: string;
  apiKey2?: string;
}

const useGameLogic = (
  mode: string | undefined,
  startTimers: boolean,
  resumeGameId?: string,
  players?: { playerWhite: string; playerBlack: string },
  llmOptions?: LLMOptions
) => {
  const initialResetDone = useRef(false);
  const llmOptionsRef = useRef<LLMOptions | undefined>(llmOptions);
  const moveHistoryRef = useRef<string[]>([]);
  const thinkingConversationRef = useRef<string[]>([]);

  const [gameId] = useState<string>(() => resumeGameId || Date.now().toString());
  const [playerNames, setPlayerNames] = useState(() => players || { playerWhite: '', playerBlack: '' });
  const [startDate] = useState<string>(() => (resumeGameId ? "" : new Date().toISOString()));
  const [position, setPosition] = useState<string>(ChessService.getFEN());
  const [moveHistory, setMoveHistory] = useState<string[]>(ChessService.getHistory());
  const [gameStatus, setGameStatus] = useState<string>('Game in Progress');
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>(ChessService.getGame().turn());
  const [thinkingConversation, setThinkingConversation] = useState<string[]>([]);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState<boolean>(!!llmOptions?.thinkingMode);

  useEffect(() => { moveHistoryRef.current = moveHistory; }, [moveHistory]);
  useEffect(() => { thinkingConversationRef.current = thinkingConversation; }, [thinkingConversation]);

  useEffect(() => {
    if (resumeGameId) {
      const savedGame = getSavedGames().find(game => game.gameId === resumeGameId);
      if (savedGame) {
        ChessService.getGame().load(savedGame.fen);
        setPosition(savedGame.fen);
        setMoveHistory(savedGame.history);
        setGameStatus(savedGame.status);
        setCurrentTurn(savedGame.turn);
        setPlayerNames({ playerWhite: savedGame.playerWhite, playerBlack: savedGame.playerBlack });
        setIsThinkingModeEnabled(!!savedGame.thinkingMode);
        llmOptionsRef.current = {
          provider: savedGame.llmProvider ?? '',
          apiKey: savedGame.llmApiKey,
          thinkingMode: !!savedGame.thinkingMode,
          provider2: savedGame.llmProvider2,
          apiKey2: savedGame.llmApiKey2
        };
      }
    } else if (llmOptions) {
      setIsThinkingModeEnabled(!!llmOptions.thinkingMode);
    }
  }, [resumeGameId, llmOptions]);

  const updateGameState = useCallback(() => {
    const game = ChessService.getGame();
    const fen = game.fen();
    const history = game.history();
    const options = llmOptionsRef.current;

    setPosition(fen);
    setMoveHistory(history);
    setCurrentTurn(game.turn());

    if (game.isGameOver()) {
      removeSavedGame(gameId);
    } else {
      const state: GameState = {
        gameId,
        fen,
        history,
        status: 'Game in Progress',
        turn: game.turn(),
        mode: mode || 'human',
        playerWhite: playerNames.playerWhite,
        playerBlack: playerNames.playerBlack,
        datePlayed: startDate || new Date().toISOString(),
        llmProvider: options?.provider,
        llmApiKey: options?.apiKey,
        thinkingMode: isThinkingModeEnabled,
        llmProvider2: options?.provider2,
        llmApiKey2: options?.apiKey2,
      };
      saveGameToLocalStorage(state);
    }
  }, [gameId, mode, playerNames, startDate, isThinkingModeEnabled]);

  useEffect(() => {
    if (!resumeGameId && !initialResetDone.current) {
      ChessService.reset();
      updateGameState();
      initialResetDone.current = true;
    }
  }, [resumeGameId, updateGameState]);

  const triggerLLMConversation = useCallback(async () => {
    const options = llmOptionsRef.current;
    const { provider, apiKey, thinkingMode, provider2, apiKey2 } = options || {};
    if (!apiKey || (thinkingMode && provider2 && !apiKey2)) return;

    const fen = ChessService.getFEN();
    const currentMoveHistory = moveHistoryRef.current;
    const currentConversation = thinkingConversationRef.current;
    const isInitial = currentConversation.length === 0;
    const includeAnswerFormat = !isInitial;

    const conversationContext = `Conversation so far:\n${currentConversation.join('\n')}`;

    const response1 = await LLMService.getConversationMove(
      provider,
      apiKey,
      fen,
      currentMoveHistory,
      conversationContext,
      includeAnswerFormat
    );

    setThinkingConversation(prev => {
      const updated = [...prev, `LLM1: ${response1.message}`];
      thinkingConversationRef.current = updated;
      return updated;
    });

    const response2 = await LLMService.getConversationMove(
      provider2 || provider,
      provider2 ? apiKey2! : apiKey,
      fen,
      currentMoveHistory,
      conversationContext,
      includeAnswerFormat
    );

    setThinkingConversation(prev => {
      const updated = [...prev, `LLM2: ${response2.message}`];
      thinkingConversationRef.current = updated;
      return updated;
    });

    const answerRegex = /ANSWER:\s*([a-h][1-8][a-h][1-8])/i;
    const match1 = response1.message.match(answerRegex);
    const match2 = response2.message.match(answerRegex);

    const tryToPlayMove = (uci: string | undefined): boolean => {
      if (!uci || uci.length !== 4) return false;
      const move = ChessService.getGame().move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: 'q',
      });
      if (move) {
        updateGameState();

        setThinkingConversation([]);
        thinkingConversationRef.current = [];

        return true;
      }
      return false;
    };

    if (match1 && tryToPlayMove(match1[1])) return;
    if (match2 && tryToPlayMove(match2[1])) return;

    if (!isInitial && response1.move && response1.move === response2.move) {
      if (tryToPlayMove(response1.move)) return;
    }

    const feedback = `System: The move you provided was not valid. Please respond with a legal move in UCI format (e.g., e2e4) and begin your reply with "ANSWER:"`;
    setThinkingConversation(prev => {
      const updated = [...prev, feedback];
      thinkingConversationRef.current = updated;
      return updated;
    });

    setTimeout(triggerLLMConversation, 1000);
  }, [updateGameState]);

  const triggerLLMMove = useCallback(async () => {
    const options = llmOptionsRef.current;
    if (isThinkingModeEnabled) {
      triggerLLMConversation();
      return;
    }

    try {
      const provider = options?.provider || 'Google Gemini';
      const key = options?.apiKey || '';
      if (!key) return;

      const fen = ChessService.getFEN();
      let response = await LLMService.getMove(provider, key, fen);
      let move;
      let attempts = 0;

      while (attempts < 10) {
        try {
          move = ChessService.getGame().move({
            from: response.move.slice(0, 2),
            to: response.move.slice(2, 4),
            promotion: 'q',
          });
          if (move) break;
        } catch {
          // Ignore errors and continue to retry
        }
        attempts++;
        if (attempts < 10) {
          response = await LLMService.getMove(provider, key, fen, true, response.move);
          if (!response?.move) return;
        }
      }
      if (move) updateGameState();
    } catch (error) {
      console.error('Error from LLMService:', error);
    }
  }, [isThinkingModeEnabled, updateGameState, triggerLLMConversation]);

  const onMove = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    let move;
    try {
      move = ChessService.getGame().move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    } catch {
      return false;
    }
    if (!move) return false;

    updateGameState();
    if (mode === 'llm' && !ChessService.getGame().isGameOver()) {
      setTimeout(() => triggerLLMMove(), 500);
    }
    return true;
  }, [mode, updateGameState, triggerLLMMove]);

  const resetGame = useCallback(() => {
    ChessService.reset();
    updateGameState();
    removeSavedGame(gameId);
    setThinkingConversation([]);
    thinkingConversationRef.current = [];
  }, [updateGameState, gameId]);

  return {
    position,
    moveHistory,
    gameStatus,
    currentTurn,
    onMove,
    resetGame,
    gameId,
    thinkingConversation,
    isThinkingModeEnabled
  };
};

export default useGameLogic;
