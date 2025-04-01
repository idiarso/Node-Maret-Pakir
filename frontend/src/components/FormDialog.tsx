import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  CircularProgress,
} from '@mui/material';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'email' | 'password';
  required?: boolean;
  options?: { label: string; value: string | number }[];
  defaultValue?: any;
  fullWidth?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
}

interface FormDialogProps {
  open: boolean;
  title: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}

const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
}) => {
  const [values, setValues] = React.useState<Record<string, any>>(initialValues);

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues({
      ...values,
      [name]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      fullWidth: field.fullWidth ?? true,
      required: field.required ?? false,
      value: values[field.name] || '',
      onChange: handleChange(field.name),
      name: field.name,
      label: field.label,
    };

    switch (field.type) {
      case 'select':
        return (
          <TextField
            {...commonProps}
            select
            SelectProps={{
              native: false,
            }}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return <TextField {...commonProps} type={field.type} />;
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {fields.map((field) => (
                <Grid
                  item
                  xs={field.xs ?? 12}
                  sm={field.sm ?? 6}
                  md={field.md ?? 6}
                  key={field.name}
                >
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog; 