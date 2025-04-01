import React from 'react';
import { Typography } from '@mui/material';

interface GameStatusProps {
  status: string;
}

const GameStatus: React.FC<GameStatusProps> = ({ status }) => {
  return (
    <Typography variant="h6" color="secondary">
      {status}
    </Typography>
  );
};

export default GameStatus;
