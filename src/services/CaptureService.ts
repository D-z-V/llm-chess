import { Chess } from 'chess.js';

const unicodeMapping: Record<string, { w: string; b: string }> = {
  p: { w: '♙', b: '♟︎' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  r: { w: '♖', b: '♜' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' }
};

export const getCapturedPieces = (chess: Chess): { lostWhite: string[]; lostBlack: string[] } => {
  const history = chess.history({ verbose: true });
  const lostWhite: string[] = [];
  const lostBlack: string[] = [];
  history.forEach(move => {
    if (move.captured) {
      // If white moved, then black lost a piece; if black moved, white lost a piece.
      if (move.color === 'w') {
        lostBlack.push(unicodeMapping[move.captured].b);
      } else {
        lostWhite.push(unicodeMapping[move.captured].w);
      }
    }
  });
  return { lostWhite, lostBlack };
};
