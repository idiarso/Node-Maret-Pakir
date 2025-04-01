import React, { ReactNode } from 'react';
import { Typography, Box, Button, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ErrorBoundary } from 'react-error-boundary';

interface Props {
  children: ReactNode;
  title?: string;
}

const PageWrapper: React.FC<Props> = ({ children, title }) => {
  
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        m: 2, 
        maxWidth: '100%', 
        mx: 'auto', 
        bgcolor: '#fff8f8' 
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        Error in {title || 'Page'}
      </Typography>
      
      <Typography variant="body1" paragraph>
        This component encountered an error. You can try again or navigate to another page.
      </Typography>
      
      {process.env.NODE_ENV !== 'production' && (
        <Box 
          sx={{ 
            p: 2, 
            my: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            overflow: 'auto'
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Error Details:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ color: 'error.main' }}>
            {error.message}
          </Typography>
          
          <Typography variant="body2" component="pre" sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 1 }}>
            {error.stack}
          </Typography>
        </Box>
      )}
      
      <Button 
        variant="contained" 
        startIcon={<RefreshIcon />}
        onClick={resetErrorBoundary}
      >
        Try Again
      </Button>
    </Paper>
  );

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset local state if needed
        console.log('Error boundary reset in PageWrapper');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default PageWrapper; 