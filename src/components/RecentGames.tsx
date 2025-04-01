
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Card, CardContent, CardActions, Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { GameState } from '../hooks/useGameLogic';

const LOCAL_STORAGE_KEY = "chessSavedGames";

const RecentGames: React.FC<{ onResume: (game: GameState) => void }> = ({ onResume }) => {
  const [games, setGames] = useState<GameState[]>([]);

  const loadSavedGames = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const games: GameState[] = saved ? JSON.parse(saved) : [];
    setGames(games);
  }, []);

  const deleteGame = (gameId: string) => {
    const filtered = games.filter(game => game.gameId !== gameId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    setGames(filtered);
  };

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  if (games.length === 0) {
    return (
      <Box color="white">
        <Typography variant="h6">No Recently Paused Games</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" color="white" gutterBottom>
        Recently Paused Games
      </Typography>
      <Grid container spacing={2}>
        {games.map(game => (
          <Grid item xs={12} key={game.gameId}>
            <Card sx={{ backgroundColor: '#1e1e1e', color: 'white' }}>
              <CardContent
                onClick={() => onResume(game)}
                sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                <Typography variant="subtitle1">
                  {game.playerWhite} vs {game.playerBlack}
                </Typography>
                <Typography variant="body2">
                  {new Date(game.datePlayed).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Status: {game.status}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => deleteGame(game.gameId)} color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RecentGames;
