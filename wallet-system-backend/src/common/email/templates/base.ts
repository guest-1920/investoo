export const baseTemplate = (
  title: string,
  content: string,
  actionUrl?: string,
  actionText?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #18181b; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background: #18181b; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .content { padding: 32px; }
    .content h2 { margin-top: 0; font-size: 20px; font-weight: 600; color: #18181b; }
    .content p { line-height: 1.6; color: #52525b; font-size: 16px; margin-bottom: 24px; }
    .button { display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; transition: background-color 0.2s; }
    .button:hover { background-color: #27272a; }
    .footer { padding: 24px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
    .footer p { margin: 0; font-size: 14px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Investoo</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${content}
      ${actionUrl ? `<div style="text-align: center; margin-top: 32px;"><a href="${actionUrl}" class="button">${actionText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Investoo. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
