import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface MoveHistoryProps {
  moves: string[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  return (
    <Paper
      sx={{
        backgroundColor: '#1e1e1e',
        padding: 2,
        mt: 2,
        width: '100%',
        maxWidth: 500,
        margin: 'auto'
      }}
    >
      <Typography variant="h6" color="primary" textAlign="center">
        Move History
      </Typography>
      <Box mt={1} display="flex" flexWrap="wrap" gap={1} justifyContent="center">
        {moves.map((move, index) => {
          const icon = index % 2 === 0 ? '♔' : '♚';
          return (
            <Typography key={index} variant="body1" color="white">
              {icon} {move}
            </Typography>
          );
        })}
      </Box>
    </Paper>
  );
};

export default MoveHistory;
