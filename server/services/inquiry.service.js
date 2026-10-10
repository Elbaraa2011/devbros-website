import crypto from 'node:crypto';

export class InquiryService {
  constructor({ db, emailService, env, logger = console }) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.logger = logger;
    this.insertStmt = db.prepare(`
      INSERT INTO inquiries
        (name, email, phone, business_type, interested_tier, project_details, budget_range, ip_hash)
      VALUES
        (@name, @email, @phone, @business_type, @interested_tier, @project_details, @budget_range, @ip_hash)
    `);
    this.updateEmailStatusStmt = db.prepare(
      'UPDATE inquiries SET email_status = ? WHERE id = ?'
    );
  }

  create(data, ip) {
    const ip_hash = ip
      ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24)
      : null;

    const result = this.insertStmt.run({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      business_type: data.business_type,
      interested_tier: data.interested_tier || null,
      project_details: data.project_details,
      budget_range: data.budget_range,
      ip_hash
    });

    return { id: result.lastInsertRowid, ...data, ip_hash };
  }

  // Runs both emails. If either fails, still save and log, never throw.
  async sendEmails(inquiry) {
    const [notification, autoReply] = await Promise.all([
      this.emailService.notificationEmail(inquiry),
      this.emailService.autoReplyEmail(inquiry)
    ]);

    const bothSent = notification.sent && autoReply.sent;
    const anyAttempted = !notification.skipped;
    this.updateEmailStatusStmt.run(bothSent ? 'sent' : anyAttempted ? 'failed' : 'skipped', inquiry.id);

    if (!bothSent) {
      this.logger.warn(`[inquiry:${inquiry.id}] Email delivery issue. Stored for retry, inquiry still confirmed to visitor.`);
    }

    return bothSent;
  }
}
