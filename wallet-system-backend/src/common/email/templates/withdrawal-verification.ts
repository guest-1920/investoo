import { baseTemplate } from './base';

export const withdrawalVerificationTemplate = (
  link: string,
  amount: number,
  currency: string,
) =>
  baseTemplate(
    'Confirm Withdrawal Request',
    `<p>You have requested to withdraw <strong>${currency} ${amount}</strong>.</p>
    <p>Please confirm this request by clicking the button below. If you did not initiate this, please contact support immediately.</p>
    <p>This verification link is valid for 15 minutes.</p>`,
    link,
    'Confirm Withdrawal',
  );
