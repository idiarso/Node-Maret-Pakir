import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface DialogProps {
  open: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  showClose?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  showSubmit?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  children,
  actions,
  loading = false,
  error = null,
  success = null,
  maxWidth = 'sm',
  fullWidth = true,
  showClose = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  showCancel = true,
  showSubmit = true,
  onClose,
  onSubmit,
  onCancel,
}) => {
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <MuiDialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Transition}
    >
      {title && (
        <DialogTitle>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
          }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {showClose && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={onClose}
                disabled={loading}
                aria-label="close"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      <DialogContent dividers>
        {(error || success) && (
          <Box sx={{ mb: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        )}
        {children}
      </DialogContent>

      {(actions || showSubmit || showCancel) && (
        <DialogActions>
          {actions || (
            <>
              {showCancel && (
                <Button
                  onClick={onCancel || onClose}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
              )}
              {showSubmit && (
                <Button
                  variant="contained"
                  onClick={onSubmit}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Menyimpan...' : submitLabel}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      )}
    </MuiDialog>
  );
}; 