// Regex patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+62|62|0)8[1-9][0-9]{6,9}$/,
  PLATE: /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};

// Validation functions
export const isValidEmail = (email: string): boolean => {
  return PATTERNS.EMAIL.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return PATTERNS.PHONE.test(phone);
};

export const isValidPlate = (plate: string): boolean => {
  return PATTERNS.PLATE.test(plate.toUpperCase());
};

export const isValidUsername = (username: string): boolean => {
  return PATTERNS.USERNAME.test(username);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Error messages
export const getErrorMessage = (field: string, value: string): string | null => {
  switch (field) {
    case 'email':
      return !value ? 'Email is required' :
        !isValidEmail(value) ? 'Invalid email address' : null;
    case 'phone':
      return !value ? 'Phone number is required' :
        !isValidPhone(value) ? 'Invalid phone number' : null;
    case 'plate':
      return !value ? 'Plate number is required' :
        !isValidPlate(value) ? 'Invalid plate number' : null;
    case 'username':
      return !value ? 'Username is required' :
        !isValidUsername(value) ? 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' : null;
    case 'password':
      return !value ? 'Password is required' :
        !isValidPassword(value) ? 'Password must be at least 6 characters' : null;
    default:
      return !value ? `${field} is required` : null;
  }
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPlate,
  isValidUsername,
  isValidPassword,
  getErrorMessage,
}; 