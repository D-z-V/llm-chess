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
    // Start a fresh game by not passing any resume ID. 
    setSetupMode(mode); 
    setDialogOpen(true); 
  }; 
 
  const handleDialogSubmit = (players: { playerWhite: string; playerBlack: string; llmProvider?: string, apiKey?: string }) => {
    setDialogOpen(false); 
    // Navigate to the game page WITHOUT a resume ID so a fresh game is started. 
    navigate( 
      `/game/${setupMode}?playerWhite=${encodeURIComponent( 
        players.playerWhite 
      )}&playerBlack=${encodeURIComponent(players.playerBlack)}${setupMode === 'llm' && players.llmProvider ? `&llmProvider=${encodeURIComponent(players.llmProvider)}&apiKey=${encodeURIComponent(players.apiKey)}` : ''}` 
    ); 
  }; 
 
  const handleDialogClose = () => { 
    setDialogOpen(false); 
  }; 
 
  const handleResume = (game: GameState) => { 
    // When resuming, pass the resume gameId 
    navigate( 
      `/game/${game.mode}?resume=${game.gameId}&playerWhite=${encodeURIComponent(game.playerWhite)}&playerBlack=${encodeURIComponent(game.playerBlack)} ${game.llmProvider ? `&llmProvider=${encodeURIComponent(game.llmProvider)}&apiKey=${encodeURIComponent(game.llmApiKey)}` : ''}`
    ); 
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
      <PlayerSetupDialog mode={setupMode || 'human'} open={dialogOpen} onSubmit={handleDialogSubmit} onClose={handleDialogClose} /> 
    </Box> 
  ); 
}; 
 
export default Home;