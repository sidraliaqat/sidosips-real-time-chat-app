// Lightweight client-side validation. The backend re-validates everything —
// this is purely for fast, friendly feedback before a request is sent.

const GMAIL_REGEX = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
const NAME_NO_NUMBERS_REGEX = /^[^\d]+$/;

export function validateName(name) {
  if (!name || !name.trim()) return 'Name is required';
  if (name.trim().length < 2 || name.trim().length > 50) {
    return 'Name must be between 2 and 50 characters';
  }
  if (!NAME_NO_NUMBERS_REGEX.test(name)) return 'Name must not contain numbers';
  return null;
}

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required';
  if (!GMAIL_REGEX.test(email.trim().toLowerCase())) {
    return 'Only @gmail.com addresses are supported';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

export function passwordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0-4
}
