import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Grid, Button, Typography, Snackbar, Alert } from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Chessboard from '../components/Chessboard';
import MoveHistory from '../components/MoveHistory';
import TimerPanel from '../components/TimerPanel';
import useGameLogic from '../hooks/useGameLogic';
import { getCapturedPieces } from '../services/CaptureService';
import ChessService from '../services/ChessService';

const Game: React.FC = () => {
  const { mode } = useParams<{ mode: string }>(); // 'human' or 'llm'
  const [searchParams] = useSearchParams();
  const resumeGameId = searchParams.get('resume') || undefined;
  const playerWhite = searchParams.get('playerWhite') || '';
  const playerBlack = searchParams.get('playerBlack') || (mode === 'llm' ? 'LLM' : '');
  // Retrieve LLM provider and API key (if applicable) from query params.
  const llmProvider = searchParams.get('llmProvider') || 'Google Gemini';
  const apiKey = searchParams.get('apiKey') || '';
  const navigate = useNavigate();

  // In LLM mode, assume settings provided via home modal, so LLM is initialized.
  const [llmInitialized] = useState(true);
  const [illegalMoveToastOpen, setIllegalMoveToastOpen] = useState<boolean>(false);
  const [llmMoveToastOpen, setLlmMoveToastOpen] = useState<boolean>(false);

  const { position, moveHistory, gameStatus, currentTurn, onMove, resetGame } = useGameLogic(
    mode,
    llmInitialized,
    resumeGameId,
    { playerWhite, playerBlack },
    { provider: llmProvider, apiKey: apiKey }
  );

  // Compute captured pieces using moveHistory as dependency.
  const { lostWhite, lostBlack } = useMemo(() => getCapturedPieces(ChessService.getGame()), [moveHistory]);

  const handleTimeUp = useCallback(
    (player: 'w' | 'b') => {
      alert(`${player === 'w' ? playerWhite : playerBlack} time up!`);
      resetGame();
      navigate('/');
    },
    [resetGame, navigate, playerWhite, playerBlack]
  );

  const handlePieceDrop = (sourceSquare: string, targetSquare: string): boolean => {
    const result = onMove(sourceSquare, targetSquare);
    if (!result) {
      setIllegalMoveToastOpen(true);
    }
    return result;
  };

  const handlePauseAndSave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleEndGame = useCallback(() => {
    resetGame();
    navigate('/');
  }, [resetGame, navigate]);

  // Handle browser back navigation like Pause & Save.
  useEffect(() => {
    const handlePopState = () => {
      handlePauseAndSave();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePauseAndSave]);

  // Determine last move icon: alternating icons for white/black.
  const lastMoveIcon = moveHistory.length % 2 === 0 ? '♚' : '♔';

  // Show LLM move toast when in LLM mode and it's now human's turn.
  useEffect(() => {
    if (mode === 'llm' && currentTurn === 'w' && moveHistory.length > 0) {
      setLlmMoveToastOpen(true);
    }
  }, [mode, currentTurn, moveHistory]);

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
      <Grid container spacing={2} display="flex" justifyContent="center">
        <Grid item xs={12} md={8}>
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
        </Grid>
      </Grid>
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
