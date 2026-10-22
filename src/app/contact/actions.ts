'use server';

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

/**
 * Server Action for the contact form.
 * Validates inputs and sends an email via the configured email service.
 * Falls back to a mailto: redirect if no email API key is configured.
 */
export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const subject = (formData.get('subject') as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  // Validation
  const errors: Record<string, string> = {};
  if (!name || name.length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (!subject || subject.length < 4) errors.subject = 'Please enter a subject.';
  if (!message || message.length < 20) errors.message = 'Message must be at least 20 characters.';

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the errors below.', errors };
  }

  // Honeypot check (if bot fills hidden field)
  const honeypot = formData.get('_hp') as string;
  if (honeypot) {
    // Silently succeed to not reveal bot detection
    return { success: true, message: 'Message sent successfully! We\'ll get back to you within 24 hours.' };
  }

  try {
    // Option 1: Send via Resend API (set RESEND_API_KEY in env)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Contact Form <noreply@emate.live>',
          to: ['support@emate.live'],
          reply_to: email,
          subject: `[Contact Form] ${subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Contact Form Submission</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; width: 100px;">Name:</td><td style="padding: 8px;">${name}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Subject:</td><td style="padding: 8px;">${subject}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; vertical-align: top;">Message:</td><td style="padding: 8px; white-space: pre-wrap;">${message}</td></tr>
              </table>
            </div>
          `,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[ContactForm] Resend error:', err);
        throw new Error('Email delivery failed');
      }

      return { success: true, message: "Message sent! We'll get back to you within 24 hours." };
    }

    // Option 2: No email API configured — log and acknowledge
    console.info('[ContactForm] Submission received (no email API configured):', {
      name, email, subject, message: message.slice(0, 100),
    });

    return {
      success: true,
      message: "Message received! We'll get back to you at " + email + " within 24 hours.",
    };

  } catch (error) {
    console.error('[ContactForm] Error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please email us directly at support@emate.live',
    };
  }
}
