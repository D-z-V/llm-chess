import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Chessboard from '../components/Chessboard';
import MoveHistory from '../components/MoveHistory';
import TimerPanel from '../components/TimerPanel';
import useGameLogic from '../hooks/useGameLogic';
import { getCapturedPieces } from '../services/CaptureService';
import ChessService from '../services/ChessService';
import ThinkingThread from '../components/ThinkingThread';

const Game: React.FC = () => {
  const { mode } = useParams<{ mode: string }>();
  const [searchParams] = useSearchParams();
  const resumeGameId = searchParams.get('resume') || undefined;
  const playerWhite = searchParams.get('playerWhite') || '';
  const playerBlack = searchParams.get('playerBlack') || (mode === 'llm' ? 'LLM' : '');
  const llmProvider = searchParams.get('llmProvider') || 'Google Gemini';
  const apiKey = searchParams.get('apiKey') || '';
  const thinkingMode = searchParams.get('thinkingMode') === 'true';
  const llmProvider2 = searchParams.get('llmProvider2') || '';
  const apiKey2 = searchParams.get('apiKey2') || '';

  const navigate = useNavigate();
  const [llmInitialized] = useState(true);
  const [illegalMoveToastOpen, setIllegalMoveToastOpen] = useState<boolean>(false);
  const [llmMoveToastOpen, setLlmMoveToastOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log("Initializing game with thinking mode:", thinkingMode);
  }, [thinkingMode]);

  const {
    position,
    moveHistory,
    gameStatus,
    currentTurn,
    onMove,
    resetGame,
    thinkingConversation,
    isThinkingModeEnabled
  } = useGameLogic(
    mode,
    llmInitialized,
    resumeGameId,
    { playerWhite, playerBlack },
    {
      provider: llmProvider,
      apiKey,
      thinkingMode,
      provider2: llmProvider2,
      apiKey2
    }
  );

  const { lostWhite, lostBlack } = useMemo(() => getCapturedPieces(ChessService.getGame()), [moveHistory]);

  const handlePauseAndSave = useCallback(() => {
    navigate(`/?thinkingMode=${isThinkingModeEnabled}`);
  }, [navigate, isThinkingModeEnabled]);

  const handleEndGame = useCallback(() => {
    resetGame();
    navigate(`/?thinkingMode=${isThinkingModeEnabled}`);
  }, [resetGame, navigate, isThinkingModeEnabled]);

  const handleTimeUp = useCallback(
    (player: 'w' | 'b') => {
      alert(`${player === 'w' ? playerWhite : playerBlack} time up!`);
      handleEndGame();
    },
    [handleEndGame, playerWhite, playerBlack]
  );

  const handlePieceDrop = (sourceSquare: string, targetSquare: string): boolean => {
    const result = onMove(sourceSquare, targetSquare);
    if (!result) {
      setIllegalMoveToastOpen(true);
    }
    return result;
  };

  useEffect(() => {
    const handlePopState = () => {
      handlePauseAndSave();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePauseAndSave]);

  const lastMoveIcon = moveHistory.length % 2 === 0 ? '♚' : '♔';

  useEffect(() => {
    if (mode === 'llm' && currentTurn === 'w' && moveHistory.length > 0) {
      setLlmMoveToastOpen(true);
    }
  }, [mode, currentTurn, moveHistory]);

  const debugInfo = mode === 'llm' ? `Thinking Mode: ${isThinkingModeEnabled ? 'ON' : 'OFF'}` : '';

  return (
    <Box padding={2} bgcolor="#121212" minHeight="100vh">
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button variant="contained" color="secondary" onClick={handlePauseAndSave}>
          Pause & Save
        </Button>
        <Button variant="contained" color="error" onClick={handleEndGame}>
          End Game
        </Button>
      </Box>

      <Typography variant="h4" align="center" color="white" gutterBottom>
        {gameStatus} - {currentTurn === 'w' ? `${playerWhite}'s Turn` : `${playerBlack}'s Turn`}
      </Typography>

      {debugInfo && (
        <Typography variant="subtitle2" align="center" color="primary" gutterBottom>
          {debugInfo}
        </Typography>
      )}

      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mt={2}>
        <Box flex={isThinkingModeEnabled ? 0.65 : 1} minWidth={0}>
          <Box display="flex" flexDirection="column" alignItems="center">
            {moveHistory.length > 0 && (
              <Typography variant="subtitle1" color="primary">
                Last Move: {lastMoveIcon} {moveHistory[moveHistory.length - 1]}
              </Typography>
            )}
            <Chessboard position={position} onPieceDrop={handlePieceDrop} />
            <MoveHistory moves={moveHistory} />
          </Box>
          <TimerPanel
            whiteInitial={300}
            blackInitial={300}
            currentTurn={currentTurn}
            onTimeUp={handleTimeUp}
            startTimers={llmInitialized}
            capturedWhite={lostWhite}
            capturedBlack={lostBlack}
          />
        </Box>
        {isThinkingModeEnabled && (
          <Box
            flex={0.35}
            minWidth={300}
            ml={{ xs: 0, md: 2 }}
            mr={{ xs: 0, md: 4 }}
            sx={{ alignSelf: 'flex-start' }}
          >
            <ThinkingThread conversation={thinkingConversation} />
          </Box>

        )}
      </Box>

      <Snackbar
        open={illegalMoveToastOpen}
        autoHideDuration={3000}
        onClose={() => setIllegalMoveToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setIllegalMoveToastOpen(false)} severity="warning" sx={{ width: '100%' }}>
          Illegal move attempted!
        </Alert>
      </Snackbar>

      <Snackbar
        open={llmMoveToastOpen}
        autoHideDuration={3000}
        onClose={() => setLlmMoveToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setLlmMoveToastOpen(false)} severity="success" sx={{ width: '100%' }}>
          LLM played a move!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Game;
