import React from 'react';
import { useMediaQuery, useTheme, Box } from '@mui/material';
import { Chessboard as ReactChessboard } from 'react-chessboard';

interface ChessboardProps {
  position: string;
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({ position, onPieceDrop }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const boardWidth = isSmallScreen ? Math.min(window.innerWidth * 0.9, 350) : 500;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" padding={2}>
      <ReactChessboard
        position={position}
        onPieceDrop={(sourceSquare, targetSquare) => onPieceDrop(sourceSquare, targetSquare)}
        boardWidth={boardWidth}
      />
    </Box>
  );
};

export default Chessboard;
