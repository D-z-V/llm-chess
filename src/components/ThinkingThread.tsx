// ThinkingThread.tsx
import { React, useEffect, useRef } from 'react';
import { Paper, Typography, Box } from '@mui/material';

const ThinkingThread: React.FC<ThinkingThreadProps> = ({ conversation }) => {
    const endRef = useRef<HTMLDivElement>(null);
useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  return (
    <Paper
      sx={{
        backgroundColor: '#2e2e2e',
        padding: 2,
        maxHeight: '80vh',
        overflowY: 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" color="secondary" gutterBottom>
        LLM Thinking Thread
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {conversation.map((msg, index) => (
          <Typography key={index} variant="body2" color="white">
            {msg}
          </Typography>
        ))}
        <div ref={endRef} />
      </Box>
    </Paper>

  );
};

export default ThinkingThread;
