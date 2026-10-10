export class HealthController {
  constructor({ startedAt, db }) {
    this.startedAt = startedAt;
    this.db = db;
  }

  async check(req, res) {
    let dbOk = true;
    try {
      this.db.prepare('SELECT 1').get();
    } catch {
      dbOk = false;
    }

    return res.json({
      ok: dbOk,
      status: dbOk ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString()
    });
  }
}
