// Format plate number (e.g., "B 1234 ABC")
export const formatPlate = (plate: string): string => {
  const cleaned = plate.toUpperCase().replace(/\s/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, -2)} ${cleaned.slice(-2)}`;
  }
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, -3)} ${cleaned.slice(-3)}`;
};

// Format phone number (e.g., "+62812345678")
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+62${cleaned.slice(1)}`;
  }
  return `+62${cleaned}`;
};

// Format currency (e.g., "Rp 100.000")
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date (e.g., "31/12/2023")
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format time (e.g., "23:59")
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format datetime (e.g., "31/12/2023 23:59")
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

// Format duration in minutes to hours and minutes (e.g., "2 jam 30 menit")
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} menit`;
  }
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  return `${hours} jam ${remainingMinutes} menit`;
};

export default {
  formatPlate,
  formatPhone,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
}; 