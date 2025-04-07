import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ComputerIcon from '@mui/icons-material/Computer';
import { useNavigate } from 'react-router-dom';
import PlayerSetupDialog from '../components/PlayerSetupDialog';
import RecentGames from '../components/RecentGames';
import { GameState } from '../hooks/useGameLogic';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [setupMode, setSetupMode] = useState<'human' | 'llm' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNewGame = (mode: 'human' | 'llm') => {
    setSetupMode(mode);
    setDialogOpen(true);
  };

  const handleDialogSubmit = (players: { 
    playerWhite: string; 
    playerBlack: string; 
    llmProvider?: string; 
    apiKey?: string;
    thinkingMode?: boolean;
    useSameLLM?: boolean;
    llmProvider2?: string;
    apiKey2?: string;
  }) => {
    setDialogOpen(false);
    let url = `/game/${setupMode}?playerWhite=${encodeURIComponent(players.playerWhite)}&playerBlack=${encodeURIComponent(players.playerBlack)}`;

    if (setupMode === 'llm') {
      if (players.llmProvider) {
        url += `&llmProvider=${encodeURIComponent(players.llmProvider)}&apiKey=${encodeURIComponent(players.apiKey || '')}`;
      }
      if (players.thinkingMode !== undefined) {
        url += `&thinkingMode=${players.thinkingMode}`;
      }
      if (players.llmProvider2) {
        url += `&llmProvider2=${encodeURIComponent(players.llmProvider2)}&apiKey2=${encodeURIComponent(players.apiKey2 || '')}`;
      }
    }
    
    navigate(url);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleResume = (game: GameState) => {
    let url = `/game/${game.mode}?resume=${game.gameId}&playerWhite=${encodeURIComponent(game.playerWhite)}&playerBlack=${encodeURIComponent(game.playerBlack)}`;
    if (game.llmProvider) {
      url += `&llmProvider=${encodeURIComponent(game.llmProvider)}&apiKey=${encodeURIComponent(game.llmApiKey || '')}`;
    }
    if (game.thinkingMode !== undefined) {
      url += `&thinkingMode=${game.thinkingMode}`;
    }
    if (game.llmProvider2) {
      url += `&llmProvider2=${encodeURIComponent(game.llmProvider2)}&apiKey2=${encodeURIComponent(game.llmApiKey2 || '')}`;
    }
    navigate(url);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      bgcolor="#121212"
      minHeight="100vh"
      padding={3}
      gap={3}
      justifyContent="center"
    >
      <Box flex={1} display="flex" flexDirection="column" alignItems="center" gap={3} justifyContent={'center'}>
        <Typography variant="h3" color="white" textAlign="center">
          LLM Chess App
        </Typography>
        <Box sx={{ display: 'flex', gap: 7 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleNewGame('human')}
            sx={{
              width: 160,
              height: 160,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 3
            }}
          >
            <PeopleIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography>Human vs Human</Typography>
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleNewGame('llm')}
            sx={{
              width: 160,
              height: 160,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 3
            }}
          >
            <ComputerIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography>Human vs LLM</Typography>
          </Button>
        </Box>
      </Box>
      <Box flex={1} display="flex" flexDirection="column" alignItems="center" gap={3}>
        <RecentGames onResume={handleResume} />
      </Box>
      <PlayerSetupDialog
        mode={setupMode || 'human'}
        open={dialogOpen}
        onSubmit={handleDialogSubmit}
        onClose={handleDialogClose}
      />
    </Box>
  );
};

export default Home;
