import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterField[];
  onClear: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onClear }) => {
  const renderFilterField = (filter: FilterField) => {
    switch (filter.type) {
      case 'select':
        return (
          <TextField
            select
            fullWidth
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            size="small"
          >
            {filter.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'date':
        return (
          <TextField
            fullWidth
            label={filter.label}
            type="date"
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            size="small"
          />
        );
    }
  };

  const hasActiveFilters = filters.some((filter) => filter.value !== '');

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            {filters.map((filter) => (
              <Grid item xs={12} sm={6} md={4} key={filter.id}>
                {renderFilterField(filter)}
              </Grid>
            ))}
          </Grid>
        </Box>
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <IconButton onClick={onClear} color="primary">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default FilterBar; 