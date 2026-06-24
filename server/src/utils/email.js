/**
 * Email sending via Resend (https://resend.com).
 *
 * Why Resend instead of Nodemailer + Gmail SMTP: many hosts (including Render's free tier)
 * block outbound SMTP ports (587/465/25), which makes Gmail SMTP hang with "Connection timeout"
 * even when your credentials are correct. Resend sends over a normal HTTPS API call (port 443),
 * which is never blocked, so it works reliably on any host.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends an email via Resend's HTTP API. In development, if RESEND_API_KEY is not configured,
 * it logs the email to the console instead of throwing, so you can keep developing without
 * setting up a real API key immediately.
 */
export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("\n========== [email:dev-mode] ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML):\n${html}`);
    console.log("=======================================\n");
    return { devMode: true };
  }

  const from = process.env.EMAIL_FROM || "ChatApp <onboarding@resend.dev>";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }

  return response.json();
};

export const sendVerificationEmail = async (to, name, verifyUrl) => {
  return sendEmail({
    to,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Welcome, ${name} 👋</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          Thanks for signing up. Please confirm your email address to activate your account.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #6C5CE7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 13px;">
          Or copy this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #6C5CE7;">${verifyUrl}</a>
        </p>
        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to, name, resetUrl) => {
  return sendEmail({
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Password reset request</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          Hi ${name}, we received a request to reset your password. Click below to choose a new one.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #6C5CE7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px;">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #6C5CE7;">${resetUrl}</a>
        </p>
        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};