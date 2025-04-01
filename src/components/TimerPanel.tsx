// src/components/TimerPanel.tsx
import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';

const formatTime = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

interface TimerPanelProps {
  whiteInitial: number;
  blackInitial: number;
  currentTurn: 'w' | 'b';
  onTimeUp: (player: 'w' | 'b') => void;
  startTimers: boolean;
  capturedWhite: string[];
  capturedBlack: string[];
}

const TimerPanel: React.FC<TimerPanelProps> = ({
  whiteInitial,
  blackInitial,
  currentTurn,
  onTimeUp,
  startTimers,
  capturedWhite,
  capturedBlack,
}) => {
  const [whiteTime, setWhiteTime] = useState(whiteInitial);
  const [blackTime, setBlackTime] = useState(blackInitial);

  useEffect(() => {
    if (!startTimers) return;
    const interval = setInterval(() => {
      if (currentTurn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            onTimeUp('w');
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            onTimeUp('b');
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTurn, startTimers, onTimeUp]);

  return (
    <Box display="flex" justifyContent="space-around" padding={2} flexWrap="wrap">
      <Box textAlign="center" m={1}>
        <Typography variant="h6" color={currentTurn === 'w' ? 'primary' : 'textSecondary'}>
          White {currentTurn === 'w' && '(Your Turn)'}
        </Typography>
        <Typography variant="h4">{formatTime(whiteTime)}</Typography>
        {capturedWhite.length > 0 && (
          <Typography variant="body1" mt={1} color="secondary">
            Lost: {capturedWhite.join(' ')}
          </Typography>
        )}
      </Box>
      <Box textAlign="center" m={1}>
        <Typography variant="h6" color={currentTurn === 'b' ? 'primary' : 'textSecondary'}>
          Black {currentTurn === 'b' && '(Your Turn)'}
        </Typography>
        <Typography variant="h4">{formatTime(blackTime)}</Typography>
        {capturedBlack.length > 0 && (
          <Typography variant="body1" mt={1} color="secondary">
            Lost: {capturedBlack.join(' ')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TimerPanel;
