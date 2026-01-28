import { baseTemplate } from './base';

export const ticketStatusTemplate = (
  ticketNumber: string,
  subject: string,
  status: string,
  dashboardUrl: string,
) => {
  const statusDisplay = status.replace('_', ' ').toLowerCase();
  const statusColor = status === 'RESOLVED' ? '#22c55e' : '#6b7280';

  const content = `
    <p>The status of your support ticket <strong>${ticketNumber}</strong> has been updated.</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: 600; text-transform: capitalize;">${statusDisplay}</span></p>
    <p>Log in to your dashboard for more details.</p>
  `;
  return baseTemplate(
    'Support Ticket Status Update',
    content,
    dashboardUrl,
    'View Ticket',
  );
};
