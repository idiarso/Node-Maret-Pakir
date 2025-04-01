import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Create a wrapper component to access the useNavigate hook
const ErrorBoundaryWithRouter = (props: Props) => {
  // We can't use hooks directly in class components
  // This is a workaround to access the useNavigate hook
  const navigate = useNavigate();
  
  return <ErrorBoundaryClass {...props} navigate={navigate} />;
};

// The actual ErrorBoundary implementation
class ErrorBoundaryClass extends Component<Props & { navigate: Function }, State> {
  constructor(props: Props & { navigate: Function }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  handleResetAndNavigate = (): void => {
    this.handleReset();
    // Navigate to home page
    this.props.navigate('/');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if error is related to Router
      const isRouterError = 
        this.state.error?.message.includes('Router') || 
        this.state.error?.message.includes('route') ||
        this.state.error?.message.includes('<Router>');

      // Default fallback UI
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            m: 2, 
            maxWidth: 600, 
            mx: 'auto', 
            bgcolor: '#fff8f8' 
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          
          <Typography variant="body1" paragraph>
            {isRouterError 
              ? "There was a problem with the page routing. Let's go back to the dashboard."
              : "An error occurred in this component. Please try refreshing the page or contact support if the problem persists."}
          </Typography>
          
          {process.env.NODE_ENV !== 'production' && this.state.error && (
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
                {this.state.error.toString()}
              </Typography>
              
              {this.state.errorInfo && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2 }}>
                    Component Stack:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </>
              )}
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            
            {isRouterError && (
              <Button 
                variant="outlined"
                onClick={this.handleResetAndNavigate}
              >
                Go to Dashboard
              </Button>
            )}
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithRouter; 