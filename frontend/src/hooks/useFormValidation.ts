import { useState, useCallback } from 'react';
import * as yup from 'yup';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useFormValidation = <T extends Record<string, any>>(schema: yup.ObjectSchema<any>) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(
    async (values: T): Promise<ValidationResult> => {
      try {
        await schema.validate(values, { abortEarly: false });
        setErrors({});
        return { isValid: true, errors: {} };
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          const validationErrors: Record<string, string> = {};
          err.inner.forEach((error) => {
            if (error.path) {
              validationErrors[error.path] = error.message;
            }
          });
          setErrors(validationErrors);
          return { isValid: false, errors: validationErrors };
        }
        return { isValid: false, errors: { form: 'Validation failed' } };
      }
    },
    [schema]
  );

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    resetErrors,
  };
};

// Example validation schemas
export const userSchema = yup.object().shape({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const vehicleSchema = yup.object().shape({
  plateNumber: yup
    .string()
    .required('Plate number is required')
    .matches(/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/, 'Invalid plate number format'),
  type: yup
    .string()
    .required('Vehicle type is required')
    .oneOf(['car', 'motorcycle', 'truck'], 'Invalid vehicle type'),
});

export const paymentSchema = yup.object().shape({
  amount: yup
    .number()
    .required('Amount is required')
    .min(0, 'Amount must be greater than or equal to 0'),
  method: yup
    .string()
    .required('Payment method is required')
    .oneOf(['cash', 'card', 'ewallet'], 'Invalid payment method'),
});

export default useFormValidation; 