import React from 'react';
import { Chip } from '@mui/material';

type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusChipProps {
  status: StatusType;
  label: string;
}

const statusColors: Record<StatusType, { color: 'success' | 'error' | 'warning' | 'info'; bgColor: string }> = {
  success: { color: 'success', bgColor: '#e8f5e9' },
  error: { color: 'error', bgColor: '#ffebee' },
  warning: { color: 'warning', bgColor: '#fff3e0' },
  info: { color: 'info', bgColor: '#e3f2fd' },
};

const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const { color, bgColor } = statusColors[status];

  return (
    <Chip
      label={label}
      color={color}
      sx={{
        backgroundColor: bgColor,
        '& .MuiChip-label': {
          fontWeight: 500,
        },
      }}
    />
  );
};

export default StatusChip; 