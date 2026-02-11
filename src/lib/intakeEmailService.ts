// src/lib/intakeEmailService.ts
// Service for sending resume intake emails

export interface SendResumeEmailParams {
  email: string;
  firstName: string;
  lastName: string;
  resumeToken: string;
  intakeId: string;
}

/**
 * Send resume intake email with secure token link
 * Uses Vercel API route with Resend for email sending
 */
export async function sendResumeEmail(params: SendResumeEmailParams): Promise<void> {
  // Build resume URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  const resumeUrl = `${baseUrl}/resume-intake?token=${params.resumeToken}`;

  console.log('Sending resume email to:', params.email, 'for INT:', params.intakeId);

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'intake-resume',
        to: params.email,
        intNumber: params.intakeId,
        resumeUrl: resumeUrl,
        baseUrl: baseUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to send resume email:', response.status, errorData);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    const result = await response.json();
    console.log('Resume email sent successfully:', result);
  } catch (error) {
    console.error('Error sending resume email:', error);
    throw error;
  }
}
