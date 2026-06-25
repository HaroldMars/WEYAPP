import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Sends an email via Gmail SMTP. In development, if EMAIL_USER/EMAIL_PASS are not configured,
 * it logs the email to the console instead of throwing, so you can keep developing without
 * setting up SMTP immediately.
 *
 * NOTE: many hosting providers (e.g. Render's free tier) block outbound SMTP ports (587/465/25),
 * which causes this to hang and fail with "Connection timeout" once deployed there, even with
 * correct credentials. This works reliably on your own machine and on hosts that allow outbound
 * SMTP (e.g. Railway, a VPS, or paid Render plans). If you hit timeouts after deploying, that's
 * the cause — either switch hosts/plans, or swap this file for an HTTP-based provider instead.
 */
export const sendEmail = async ({ to, subject, html }) => {
  const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (!hasCredentials) {
    console.log("\n========== [email:dev-mode] ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML):\n${html}`);
    console.log("=======================================\n");
    return { devMode: true };
  }

  const mailer = getTransporter();
  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  return info;
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