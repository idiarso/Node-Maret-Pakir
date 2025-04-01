import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export type FieldType = 
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'time'
  | 'datetime'
  | 'switch'
  | 'textarea';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
  rows?: number;
  tooltip?: string;
  helperText?: string;
  placeholder?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export interface FormProps {
  fields: FormField[];
  values: { [key: string]: any };
  errors?: { [key: string]: string };
  touched?: { [key: string]: boolean };
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  disabled?: boolean;
  gridProps?: {
    spacing?: number;
    xs?: number;
    sm?: number;
    md?: number;
  };
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
}

export const Form: React.FC<FormProps> = ({
  fields,
  values,
  errors = {},
  touched = {},
  loading = false,
  error = null,
  success = null,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  showCancel = true,
  disabled = false,
  gridProps = {
    spacing: 2,
    xs: 12,
    sm: 6,
    md: 4,
  },
  onChange,
  onSubmit,
  onCancel,
}) => {
  const [showPassword, setShowPassword] = React.useState<{ [key: string]: boolean }>({});

  const handleTogglePassword = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const renderField = (field: FormField) => {
    const error = touched[field.name] && errors[field.name];
    const commonProps = {
      id: field.name,
      name: field.name,
      label: field.label,
      value: values[field.name] ?? '',
      onChange: (e: any) => onChange(field.name, e.target.value),
      error: !!error,
      helperText: error || field.helperText,
      disabled: loading || disabled || field.disabled,
      required: field.required,
      fullWidth: field.fullWidth !== false,
      placeholder: field.placeholder,
      size: "small" as const,
    };

    switch (field.type) {
      case 'select':
      case 'multiselect':
        return (
          <FormControl 
            error={!!error}
            fullWidth={field.fullWidth !== false}
            size="small"
          >
            <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
            <Select
              {...commonProps}
              labelId={`${field.name}-label`}
              multiple={field.type === 'multiselect'}
              value={field.type === 'multiselect' ? (values[field.name] || []) : (values[field.name] ?? '')}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || field.helperText) && (
              <FormHelperText>{error || field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            slotProps={{
              textField: {
                ...commonProps,
                InputProps: {
                  startAdornment: field.startAdornment && (
                    <InputAdornment position="start">
                      {field.startAdornment}
                    </InputAdornment>
                  ),
                  endAdornment: field.endAdornment && (
                    <InputAdornment position="end">
                      {field.endAdornment}
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        );

      case 'time':
        return (
          <TimePicker
            {...commonProps}
            slotProps={{
              textField: {
                ...commonProps,
                InputProps: {
                  startAdornment: field.startAdornment && (
                    <InputAdornment position="start">
                      {field.startAdornment}
                    </InputAdornment>
                  ),
                  endAdornment: field.endAdornment && (
                    <InputAdornment position="end">
                      {field.endAdornment}
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        );

      case 'datetime':
        return (
          <DateTimePicker
            {...commonProps}
            slotProps={{
              textField: {
                ...commonProps,
                InputProps: {
                  startAdornment: field.startAdornment && (
                    <InputAdornment position="start">
                      {field.startAdornment}
                    </InputAdornment>
                  ),
                  endAdornment: field.endAdornment && (
                    <InputAdornment position="end">
                      {field.endAdornment}
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        );

      case 'switch':
        return (
          <FormControl error={!!error}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!values[field.name]}
                  onChange={(e) => onChange(field.name, e.target.checked)}
                  disabled={loading || disabled || field.disabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {field.label}
                  {field.required && (
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  )}
                  {field.tooltip && (
                    <Tooltip title={field.tooltip}>
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  )}
                </Box>
              }
            />
            {(error || field.helperText) && (
              <FormHelperText>{error || field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={field.rows || 4}
            InputProps={{
              startAdornment: field.startAdornment && (
                <InputAdornment position="start">
                  {field.startAdornment}
                </InputAdornment>
              ),
              endAdornment: field.endAdornment && (
                <InputAdornment position="end">
                  {field.endAdornment}
                </InputAdornment>
              ),
            }}
          />
        );

      case 'password':
        return (
          <TextField
            {...commonProps}
            type={showPassword[field.name] ? 'text' : 'password'}
            InputProps={{
              startAdornment: field.startAdornment && (
                <InputAdornment position="start">
                  {field.startAdornment}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleTogglePassword(field.name)}
                    edge="end"
                    size="small"
                  >
                    {showPassword[field.name] ? (
                      <VisibilityOffIcon />
                    ) : (
                      <VisibilityIcon />
                    )}
                  </IconButton>
                  {field.endAdornment}
                </InputAdornment>
              ),
            }}
          />
        );

      default:
        return (
          <TextField
            {...commonProps}
            type={field.type}
            InputProps={{
              startAdornment: field.startAdornment && (
                <InputAdornment position="start">
                  {field.startAdornment}
                </InputAdornment>
              ),
              endAdornment: field.endAdornment && (
                <InputAdornment position="end">
                  {field.endAdornment}
                </InputAdornment>
              ),
            }}
          />
        );
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Grid container spacing={gridProps.spacing}>
        {fields.map((field) => (
          <Grid 
            item 
            key={field.name}
            xs={field.fullWidth === false ? 'auto' : gridProps.xs}
            sm={field.fullWidth === false ? 'auto' : gridProps.sm}
            md={field.fullWidth === false ? 'auto' : gridProps.md}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {renderField(field)}
              {field.tooltip && field.type !== 'switch' && (
                <Tooltip title={field.tooltip}>
                  <InfoIcon fontSize="small" color="action" sx={{ mt: 2 }} />
                </Tooltip>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>

      {(error || success) && (
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {showCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading || disabled}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Menyimpan...' : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}; 