import { baseTemplate } from './base';

export const otpTemplate = (otp: string, expiresIn: string) => {
  const content = `
    <p>For your security, we need to verify your identity.</p>
    <p>Use the following OTP to complete your login. This code will expire in <strong>${expiresIn}</strong>.</p>
    <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 0.1em; color: #18181b; margin: 24px 0;">
      ${otp}
    </div>
    <p>If you didn't request this code, please ignore this email.</p>
  `;
  return baseTemplate('Login Verification', content);
};
