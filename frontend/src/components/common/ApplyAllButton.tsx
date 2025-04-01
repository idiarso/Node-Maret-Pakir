import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface ApplyAllButtonProps {
  onApply: () => void;
  isPending: boolean;
  title?: string;
  message?: string;
}

export const ApplyAllButton: React.FC<ApplyAllButtonProps> = ({
  onApply,
  isPending,
  title = 'Terapkan Semua Perubahan',
  message = 'Apakah Anda yakin ingin menerapkan semua perubahan?'
}) => {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleConfirm = () => {
    onApply();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={handleClick}
        disabled={isPending}
      >
        Terapkan Semua
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography>{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Batal</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={isPending}
          >
            Terapkan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 