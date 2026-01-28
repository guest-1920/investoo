import { baseTemplate } from './base';

export const verificationTemplate = (url: string, expiresIn: string) => {
  const content = `
    <p>Welcome to Investoo! We're excited to have you on board.</p>
    <p>Please verify your email address to get access to your wallet and start investing.</p>
    <p>This link will expire in <strong>${expiresIn}</strong>.</p>
  `;
  return baseTemplate('Verify your email', content, url, 'Verify Email');
};
