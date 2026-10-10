import nodemailer from 'nodemailer';

export class EmailService {
  constructor({ env, logger = console }) {
    this.env = env;
    this.logger = logger;
    this.transporter = null;
  }

  // Transporter is created lazily so the service works without SMTP configured
  // (SKIP_EMAIL=true local development mode).
  getTransporter() {
    if (this.transporter) return this.transporter;
    if (!this.env.smtpConfigured) return null;

    this.transporter = nodemailer.createTransport({
      host: this.env.SMTP_HOST,
      port: this.env.SMTP_PORT,
      secure: this.env.SMTP_SECURE,
      auth: {
        user: this.env.SMTP_USER,
        pass: this.env.SMTP_PASSWORD
      }
    });

    return this.transporter;
  }

  async send({ to, from, subject, text, replyTo }) {
    if (!this.env.smtpConfigured) {
      this.logger.info(`[mail:skipped] SKIP_EMAIL=true or SMTP not configured. Would send to ${to}: ${subject}`);
      return { sent: false, skipped: true };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return { sent: false, skipped: true };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        replyTo
      });
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      // Email failure must never fail the visitor's request. Log for retry.
      this.logger.error(`[mail:error] Failed to send "${subject}" to ${to}: ${error.message}`);
      return { sent: false, error: error.message };
    }
  }

  notificationEmail(inquiry) {
    return this.send({
      to: this.env.NOTIFICATION_EMAIL,
      from: `Devbros Site <${this.env.SMTP_USER || 'noreply@devbros.local'}>`,
      replyTo: inquiry.email,
      subject: `New inquiry from ${inquiry.name}${inquiry.business_type ? ` (${inquiry.business_type})` : ''}`,
      text: [
        `New website inquiry`,
        ``,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Phone: ${inquiry.phone || 'Not provided'}`,
        `Business type: ${inquiry.business_type}`,
        `Interested tier: ${inquiry.interested_tier || 'Not sure yet'}`,
        `Budget range: ${inquiry.budget_range}`,
        `Inquiry ID: #${inquiry.id}`,
        ``,
        `Project details:`,
        inquiry.project_details
      ].join('\n')
    });
  }

  autoReplyEmail(inquiry) {
    const siteUrl = this.env.SITE_URL;
    return this.send({
      to: inquiry.email,
      from: `Devbros <${this.env.SMTP_USER || 'noreply@devbros.local'}>`,
      subject: 'We got your message, Devbros will reply today',
      text: [
        `Hi ${inquiry.name},`,
        ``,
        `Thanks for reaching out to Devbros. You have our same-day response guarantee: a real person on your email by the end of today.`,
        ``,
        `Your details, for your records:`,
        `Business type: ${inquiry.business_type}`,
        `Budget range: ${inquiry.budget_range}`,
        `Inquiry ID: #${inquiry.id}`,
        ``,
        `In a hurry? Call us at (213) 529-2457.`,
        `Or see what we build: ${siteUrl}`,
        ``,
        `Torres & Vasquez, Devbros`
      ].join('\n')
    });
  }
}
