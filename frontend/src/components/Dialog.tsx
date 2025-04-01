import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface Props {
  open: boolean;
  title: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onSubmit?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const Dialog: React.FC<Props> = ({
  open,
  title,
  maxWidth = 'sm',
  fullWidth = true,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  onSubmit,
  onClose,
  children,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {onSubmit && (
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={loading}
            autoFocus
          >
            {submitLabel}
          </Button>
        </DialogActions>
      )}
    </MuiDialog>
  );
};

export default Dialog; 