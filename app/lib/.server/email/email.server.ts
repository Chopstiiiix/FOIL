import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(apiKey: string): Resend {
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendVerificationEmail(
  apiKey: string,
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: 'LAB <noreply@contact.inspiredaily.net>',
      to: email,
      subject: 'Verify your LAB account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 8px;">Verify your email</h1>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
            Enter the following code to complete your LAB account setup:
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.5;">
            This code expires in 10 minutes. If you didn't create a LAB account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}
