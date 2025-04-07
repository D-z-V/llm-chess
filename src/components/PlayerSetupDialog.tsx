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
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';

interface PlayerSetupDialogProps {
  mode: 'human' | 'llm';
  open: boolean;
  onSubmit: (players: {
    playerWhite: string;
    playerBlack: string;
    llmProvider?: string;
    apiKey?: string;
    thinkingMode: boolean;
    useSameLLM?: boolean;
    llmProvider2?: string;
    apiKey2?: string;
  }) => void;
  onClose: () => void;
}

const PlayerSetupDialog: React.FC<PlayerSetupDialogProps> = ({ mode, open, onSubmit, onClose }) => {
  const [playerWhite, setPlayerWhite] = useState('');
  const [playerBlack, setPlayerBlack] = useState(mode === 'human' ? '' : 'LLM');
  const [llmProvider, setLlmProvider] = useState('Google Gemini');
  const [apiKey, setApiKey] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [useSameLLM, setUseSameLLM] = useState(true);
  const [llmProvider2, setLlmProvider2] = useState('OpenAI GPT');
  const [apiKey2, setApiKey2] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlayerWhite('');
      setPlayerBlack(mode === 'human' ? '' : 'LLM');
      setLlmProvider('Google Gemini');
      setApiKey('');
      setThinkingMode(false);
      setUseSameLLM(true);
      setLlmProvider2('OpenAI GPT');
      setApiKey2('');
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
    if (mode === 'llm' && !apiKey.trim()) {
      setError('API key is required for the selected LLM provider.');
      return;
    }
    if (thinkingMode && !useSameLLM && !apiKey2.trim()) {
      setError('API key for the second LLM is required when using different providers.');
      return;
    }
    
    
    onSubmit({
      playerWhite: playerWhite.trim(),
      playerBlack: mode === 'human' ? playerBlack.trim() : 'LLM',
      llmProvider,
      apiKey,
      thinkingMode,
      useSameLLM,
      llmProvider2: useSameLLM ? llmProvider : llmProvider2,
      apiKey2: useSameLLM ? apiKey : apiKey2
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {mode === 'human' ? 'Enter Player Names' : 'LLM Settings & Player Name'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Player (White)"
          fullWidth
          value={playerWhite}
          onChange={(e) => setPlayerWhite(e.target.value)}
        />
        {mode === 'human' ? (
          <TextField
            margin="dense"
            label="Player (Black)"
            fullWidth
            value={playerBlack}
            onChange={(e) => setPlayerBlack(e.target.value)}
          />
        ) : null}
        {mode === 'llm' && (
          <Box mt={2}>
            <Typography variant="subtitle1">LLM Settings</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={thinkingMode}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    console.log("Switch toggled to:", newValue);
                    setThinkingMode(newValue);
                  }}
                />
              }
              label="Thinking Mode (Two LLMs Conversing)"
            />
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
            {thinkingMode && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!useSameLLM}
                      onChange={(e) => setUseSameLLM(!e.target.checked)}
                    />
                  }
                  label="Use Different LLM for Second Agent"
                />
                {!useSameLLM && (
                  <Box mt={1}>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel id="llm-provider2-label">Second LLM Provider</InputLabel>
                      <Select
                        labelId="llm-provider2-label"
                        value={llmProvider2}
                        label="Second LLM Provider"
                        onChange={(e) => setLlmProvider2(e.target.value as string)}
                      >
                        <MenuItem value="Google Gemini">Google Gemini</MenuItem>
                        <MenuItem value="OpenAI GPT">OpenAI GPT</MenuItem>
                        <MenuItem value="Cohere">Cohere</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      margin="dense"
                      label="Second LLM API Key"
                      fullWidth
                      value={apiKey2}
                      onChange={(e) => setApiKey2(e.target.value)}
                    />
                  </Box>
                )}
              </>
            )}
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
