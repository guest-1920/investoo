import { baseTemplate } from './base';

export const resetPasswordTemplate = (url: string, expiresIn: string) => {
  const content = `
    <p>We received a request to reset your password.</p>
    <p>Click the button below to choose a new password. This link will expire in <strong>${expiresIn}</strong>.</p>
    <p>If you didn't ask for a password reset, you can safely ignore this email.</p>
  `;
  return baseTemplate('Reset Your Password', content, url, 'Reset Password');
};
