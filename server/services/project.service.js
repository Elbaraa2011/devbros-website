export class ProjectService {
  constructor({ db }) {
    this.db = db;
    this.select = db.prepare('SELECT * FROM projects ORDER BY featured DESC, title ASC');
  }

  list(category) {
    let rows = this.select.all();
    if (category && category !== 'All') {
      rows = rows.filter((r) => r.category.toLowerCase() === String(category).toLowerCase());
    }

    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      clientType: row.client_type,
      category: row.category,
      summary: row.summary,
      story: row.story,
      stack: JSON.parse(row.stack),
      metrics: JSON.parse(row.metrics),
      services: JSON.parse(row.services),
      year: row.year,
      featured: Boolean(row.featured)
    }));
  }

  categories() {
    return [...new Set(this.select.all().map((r) => r.category))];
  }
}
