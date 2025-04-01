import * as yup from 'yup';

export interface Vehicle {
  id: number;
  plateNumber: string;
  type: string;
  owner: string;
  contact: string;
  registrationDate: string;
  status: 'active' | 'blocked';
}

export type VehicleFormData = Omit<Vehicle, 'id' | 'registrationDate'>;

export const vehicleValidationSchema = yup.object().shape({
  plateNumber: yup
    .string()
    .required('Plate number is required')
    .matches(/^[A-Z0-9 ]+$/, 'Plate number must be in uppercase and can only contain letters, numbers and spaces')
    .min(4, 'Plate number must be at least 4 characters')
    .max(10, 'Plate number must not exceed 10 characters'),
  type: yup
    .string()
    .required('Vehicle type is required')
    .min(2, 'Vehicle type must be at least 2 characters')
    .max(50, 'Vehicle type must not exceed 50 characters'),
  owner: yup
    .string()
    .required('Owner name is required')
    .min(3, 'Owner name must be at least 3 characters')
    .max(100, 'Owner name must not exceed 100 characters'),
  contact: yup
    .string()
    .required('Contact number is required')
    .matches(/^[0-9+\-() ]+$/, 'Contact must be a valid phone number')
    .min(8, 'Contact must be at least 8 characters')
    .max(20, 'Contact must not exceed 20 characters'),
  status: yup
    .string()
    .oneOf(['active', 'blocked'], 'Status must be either active or blocked')
    .required('Status is required'),
}); 