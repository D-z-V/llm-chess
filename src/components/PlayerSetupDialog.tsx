// src/components/PlayerSetupDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography
} from '@mui/material';

interface PlayerSetupDialogProps {
  mode: 'human' | 'llm';
  open: boolean;
  onSubmit: (players: { playerWhite: string; playerBlack: string; llmProvider?: string; apiKey?: string }) => void;
  onClose: () => void;
}

const PlayerSetupDialog: React.FC<PlayerSetupDialogProps> = ({ mode, open, onSubmit, onClose }) => {
  const [playerWhite, setPlayerWhite] = useState('');
  const [playerBlack, setPlayerBlack] = useState(mode === 'human' ? '' : 'LLM');
  const [llmProvider, setLlmProvider] = useState('Google Gemini');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlayerWhite('');
      setPlayerBlack(mode === 'human' ? '' : 'LLM');
      setLlmProvider('Google Gemini');
      setApiKey('');
      setError('');
    }
  }, [open, mode]);

  const handleSubmit = () => {
    if (!playerWhite.trim()) {
      setError('Player (White) name is required.');
      return;
    }
    if (mode === 'human' && (!playerBlack.trim() || playerWhite.trim() === playerBlack.trim())) {
      setError('Player (Black) name is required and must be different.');
      return;
    }
    // Require API key for all LLM providers
    if (mode === 'llm' && !apiKey.trim()) {
      setError('API key is required for the selected LLM provider.');
      return;
    }
    console.log(apiKey);
    onSubmit({
      playerWhite: playerWhite.trim(),
      playerBlack: mode === 'human' ? playerBlack.trim() : 'LLM',
      llmProvider,
      apiKey: apiKey
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter Player {mode === 'human' ? 'Names' : 'Name & LLM Settings'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Player (White)"
          fullWidth
          value={playerWhite}
          onChange={(e) => setPlayerWhite(e.target.value)}
        />
        {mode === 'human' && (
          <TextField
            margin="dense"
            label="Player (Black)"
            fullWidth
            value={playerBlack}
            onChange={(e) => setPlayerBlack(e.target.value)}
          />
        )}
        {mode === 'llm' && (
          <Box mt={2}>
            <Typography variant="subtitle1">LLM Settings</Typography>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="llm-provider-label">Provider</InputLabel>
              <Select
                labelId="llm-provider-label"
                value={llmProvider}
                label="Provider"
                onChange={(e) => setLlmProvider(e.target.value as string)}
              >
                <MenuItem value="Google Gemini">Google Gemini</MenuItem>
                <MenuItem value="OpenAI GPT">OpenAI GPT</MenuItem>
                <MenuItem value="Cohere">Cohere</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="API Key"
              fullWidth
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </Box>
        )}
        {error && (
          <Typography variant="body2" color="error" mt={1}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Start Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerSetupDialog;
