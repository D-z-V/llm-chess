// src/hooks/useGameLogic.ts
import { useState, useEffect, useCallback } from 'react';
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

const useGameLogic = (
  mode: string | undefined,
  startTimers: boolean,
  resumeGameId?: string,
  players?: { playerWhite: string; playerBlack: string },
  llmOptions?: { provider: string; apiKey?: string }
) => {
  const [gameId, setGameId] = useState<string>(() => {
    if (resumeGameId) return resumeGameId;
    return Date.now().toString();
  });

  const [playerNames, setPlayerNames] = useState<{ playerWhite: string; playerBlack: string }>(() => {
    if (resumeGameId) {
      const games = getSavedGames();
      const savedGame = games.find(game => game.gameId === resumeGameId);
      return savedGame
        ? { playerWhite: savedGame.playerWhite, playerBlack: savedGame.playerBlack }
        : { playerWhite: '', playerBlack: '' };
    }
    return players || { playerWhite: '', playerBlack: '' };
  });

  const [startDate] = useState<string>(() => (resumeGameId ? "" : new Date().toISOString()));

  const [position, setPosition] = useState<string>(ChessService.getFEN());
  const [moveHistory, setMoveHistory] = useState<string[]>(ChessService.getHistory());
  const [gameStatus, setGameStatus] = useState<string>('Game in Progress');
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>(ChessService.getGame().turn());

  useEffect(() => {
    if (resumeGameId) {
      const games = getSavedGames();
      const savedGame = games.find(game => game.gameId === resumeGameId);
      if (savedGame) {
        ChessService.getGame().load(savedGame.fen);
        setPosition(savedGame.fen);
        setMoveHistory(savedGame.history);
        setGameStatus(savedGame.status);
        setCurrentTurn(savedGame.turn);
        setPlayerNames({ 
          playerWhite: savedGame.playerWhite, 
          playerBlack: savedGame.playerBlack 
        });
        // Restore LLM options from saved game
        if (savedGame.llmProvider) {
          llmOptions = {
            provider: savedGame.llmProvider,
            apiKey: savedGame.llmApiKey
          };
        }
      }
    }
  }, [resumeGameId]);

  const updateGameState = useCallback(() => {
    const game = ChessService.getGame();
    const fen = game.fen();
    setPosition(fen);
    setMoveHistory(game.history());
    setCurrentTurn(game.turn());
    
    if (game.isGameOver()) {
      removeSavedGame(gameId);
    } else {
      const state: GameState = {
        gameId,
        fen: game.fen(),
        history: game.history(),
        status: 'Game in Progress',
        turn: game.turn(),
        mode: mode || 'human',
        playerWhite: playerNames.playerWhite,
        playerBlack: playerNames.playerBlack,
        datePlayed: startDate || new Date().toISOString(),
        llmProvider: llmOptions?.provider,
        llmApiKey: llmOptions?.apiKey
      };
      saveGameToLocalStorage(state);
    }
  }, [gameId, mode, playerNames, startDate, llmOptions]);

  const triggerLLMMove = useCallback(async () => {
    try {
      const provider = llmOptions?.provider || 'Google Gemini';
      const key = llmOptions?.apiKey || '';
      
      if (!key) {
        console.error('No API key provided for LLM provider');
        return;
      }
      
      const fen = ChessService.getFEN();
  
      let response = await LLMService.getMove(provider, key, fen);
      let move;
      let attempts = 0;
  
      while (attempts < 10) {
        try {
          move = ChessService.getGame().move({
            from: response.move.slice(0, 2),
            to: response.move.slice(2, 4),
            promotion: 'q'
          });
  
          if (move) break; // If move is successful, exit loop
        } catch (error) {
          console.error(`LLM returned an invalid move (Attempt ${attempts + 1}):`, response.move, error);
        }
  
        attempts++;
        if (attempts < 10) {
          console.log(`Requesting correction from LLM (Attempt ${attempts + 1})...`);
          response = await LLMService.getMove(provider, key, fen, true, response.move);
        }
      }
  
      if (!move) {
        console.error('LLM failed to provide a valid move after 10 attempts.');
        return;
      }
  
      updateGameState();
    } catch (error) {
      console.error('Error from LLMService:', error);
    }
  }, [updateGameState, llmOptions]);
  
  const onMove = useCallback(
    async (sourceSquare: string, targetSquare: string): Promise<boolean> => {
      let move;
      let attempts = 0;
      
      if (mode === 'llm') {
        while (attempts < 10) {
          try {
            move = ChessService.getGame().move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    
            if (move) break; // If move is valid, exit loop
          } catch (error) {
            console.error(`Invalid move by user (Attempt ${attempts + 1}):`, error);
          }
    
          attempts++;
          if (attempts < 10) {
            try {
              const provider = llmOptions?.provider || 'Google Gemini';
              const key = llmOptions?.apiKey || '';
              const fen = ChessService.getFEN();
    
              console.log(`Requesting correction from LLM (Attempt ${attempts + 1})...`);
              const feedback_response = await LLMService.getMove(provider, key, fen, true, `${sourceSquare}${targetSquare}`);
    
              sourceSquare = feedback_response.move.slice(0, 2);
              targetSquare = feedback_response.move.slice(2, 4);
            } catch (llmError) {
              console.error(`LLM correction failed (Attempt ${attempts + 1}):`, llmError);
              return false;
            }
          }
        }
  
      if (!move) {
        console.error('Move failed after 10 attempts.');
        return false;
      }
    }

    else {
      move = ChessService.getGame().move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    
      if (!move) {
        console.error('Invalid move');
        return false;
      }
    }
      updateGameState();
  
      if (mode === 'llm' && !ChessService.getGame().isGameOver()) {
        setTimeout(() => {
          triggerLLMMove();
        }, 500);
      }
  
      return true;
    },
    [mode, updateGameState, triggerLLMMove, llmOptions]
  );
  

  const resetGame = useCallback(() => {
    ChessService.reset();
    updateGameState();
    removeSavedGame(gameId);
  }, [updateGameState, gameId]);

  return { position, moveHistory, gameStatus, currentTurn, onMove, resetGame, gameId };
};

export default useGameLogic;
