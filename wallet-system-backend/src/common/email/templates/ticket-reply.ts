import { baseTemplate } from './base';

export const ticketReplyTemplate = (
  ticketNumber: string,
  subject: string,
  dashboardUrl: string,
) => {
  const content = `
    <p>Great news! Our support team has responded to your ticket <strong>${ticketNumber}</strong>.</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p>Log in to your dashboard to view the response and continue the conversation.</p>
  `;
  return baseTemplate(
    'New Reply on Your Support Ticket',
    content,
    dashboardUrl,
    'View Ticket',
  );
};
