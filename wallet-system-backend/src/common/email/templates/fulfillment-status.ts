import { baseTemplate } from './base';

export const fulfillmentStatusTemplate = (
  rewardName: string,
  status: string,
  rewardType: string,
  rewardValue: number,
  dashboardUrl: string,
) => {
  const statusMessages: Record<string, { title: string; message: string }> = {
    PENDING_SELECTION: {
      title: 'Reward Available - Choose Your Claim Method',
      message: `Congratulations! You've earned a reward: <strong>${rewardName}</strong>. Please visit your dashboard to select how you'd like to claim it.`,
    },
    PENDING: {
      title: 'Reward Claim Received',
      message: `We've received your claim for <strong>${rewardName}</strong>. Our team is reviewing your request and will process it shortly.`,
    },
    PROCESSING: {
      title: 'Your Reward is Being Prepared',
      message: `Great news! Your reward <strong>${rewardName}</strong> is currently being processed. ${rewardType === 'PHYSICAL' ? 'We\'re preparing your item for shipment.' : 'Your wallet credit will be processed soon.'}`,
    },
    SHIPPED: {
      title: 'Your Reward Has Been Shipped!',
      message: `Exciting news! Your <strong>${rewardName}</strong> has been shipped and is on its way to you. <strong>Delivery typically takes 5-7 working days.</strong>`,
    },
    DELIVERED: {
      title: 'Reward Delivered Successfully',
      message: `Your reward <strong>${rewardName}</strong> has been ${rewardType === 'WALLET' ? 'credited to your wallet' : 'delivered'}. ${rewardType === 'WALLET' ? `${rewardValue.toLocaleString()} USDT has been added to your account.` : 'Thank you for being a valued member!'}`,
    },
    FAILED: {
      title: 'Reward Fulfillment Issue',
      message: `We encountered an issue processing your reward <strong>${rewardName}</strong>. Please contact our support team for assistance.`,
    },
  };

  const { title, message } = statusMessages[status] || {
    title: 'Reward Status Update',
    message: `Your reward <strong>${rewardName}</strong> status has been updated to: <strong>${status}</strong>.`,
  };

  const content = `
    <p>${message}</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">Reward Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reward:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600;">${rewardName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Type:</td>
          <td style="padding: 8px 0; color: #111827;">${rewardType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Value:</td>
          <td style="padding: 8px 0; color: #111827;">${rewardValue.toLocaleString()} USDT</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
          <td style="padding: 8px 0;">
            <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
              ${status}
            </span>
          </td>
        </tr>
      </table>
    </div>
    
    ${status === 'PENDING_SELECTION' ? '<p style="margin-top: 24px;">Visit your dashboard to choose between wallet credit or physical delivery.</p>' : ''}
    ${status === 'FAILED' ? '<p style="margin-top: 24px; color: #dc2626;">If you have any questions, please don\'t hesitate to reach out to our support team.</p>' : ''}
  `;

  return baseTemplate(
    title,
    content,
    dashboardUrl,
    status === 'PENDING_SELECTION' ? 'Claim Reward' : 'View Dashboard',
  );
};
