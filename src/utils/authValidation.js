// Client-side rules for the auth forms. Firebase validates again on its side;
// these messages just save the user a round-trip.
export const PASSWORD_MIN_LENGTH = 6;

// Deliberately loose: the real check is Firebase sending the verification email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

export function emailError(email) {
  if (isBlank(email)) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address, e.g. name@example.com.';
  return null;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailProblem = emailError(email);
  if (emailProblem) errors.email = emailProblem;
  if (isBlank(password)) errors.password = 'Password is required.';
  return errors;
}

export function validateSignupForm({ email, password, confirmPassword }) {
  const errors = {};
  const emailProblem = emailError(email);
  if (emailProblem) errors.email = emailProblem;

  if (isBlank(password)) errors.password = 'Password is required.';
  else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    errors.password = 'Mix letters and digits.';
  }

  if (isBlank(confirmPassword)) errors.confirmPassword = 'Repeat the password.';
  else if (confirmPassword !== password) errors.confirmPassword = 'The passwords do not match.';

  return errors;
}
