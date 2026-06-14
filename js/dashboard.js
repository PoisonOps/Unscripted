// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = {
  async init() {
    const user = await Auth.getUser();
    if (!user) {
      window.location.href = '/';
      return;
    }

    const name = user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'there';
    const greetingEl = document.getElementById('dash-greeting');
    if (greetingEl) greetingEl.textContent = `Welcome back, ${name}.`;

    const sessions = await DB.getUserSessions();
    this.renderStats(sessions);
    this.renderHistory(sessions);

    DB.logEvent('dashboard_viewed', { session_count: sessions.length });
  },

  renderStats(sessions) {
    const total = sessions.length;
    const scored = sessions.filter(s => s.scores?.scores?.overall != null);
    const avg = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + s.scores.scores.overall, 0) / scored.length)
      : null;
    const best = scored.length
      ? Math.max(...scored.map(s => s.scores.scores.overall))
      : null;

    const statTotal = document.getElementById('stat-total');
    const statAvg   = document.getElementById('stat-avg');
    const statBest  = document.getElementById('stat-best');

    if (statTotal) statTotal.textContent = total;
    if (statAvg)   statAvg.textContent   = avg  != null ? avg  : '—';
    if (statBest)  statBest.textContent  = best != null ? best : '—';
  },

  renderHistory(sessions) {
    const list = document.getElementById('sessions-list');
    if (!list) return;

    if (!sessions.length) {
      list.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--text-faint);font-family:var(--font-mono);font-size:0.8rem;letter-spacing:0.06em;">
        No sessions yet. <a href="/" style="color:var(--accent)">Start your first interview →</a>
      </div>`;
      return;
    }

    const CAT_COLORS = {
      campus:      '#6366F1',
      job:         '#F59E0B',
      mba:         '#8B5CF6',
      ms:          '#0D9488',
      upsc:        '#DC2626',
      scholarship: '#D97706',
    };
    const CAT_NAMES = {
      campus:      'Campus Placement',
      job:         'Job Switch',
      mba:         'MBA GD-PI',
      ms:          'Foreign MS/PhD',
      upsc:        'UPSC',
      scholarship: 'Scholarship',
    };

    list.innerHTML = sessions.map(s => {
      const score = s.scores?.scores?.overall;
      const scoreClass = score == null ? '' : score >= 70 ? 'good' : score >= 50 ? 'avg' : 'poor';
      const scoreText = score != null ? `${score}/100` : '—';
      const date = new Date(s.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const catColor = CAT_COLORS[s.category] || '#8A8070';
      const catName  = CAT_NAMES[s.category]  || s.category || 'Interview';
      const roundName = (s.round_type || '').replace(/_/g, ' ');
      const mins = Math.round((s.duration_seconds || 0) / 60);
      const qCount = s.question_count || 0;
      const title = s.company ? `${s.company} · ${roundName}` : `${catName} · ${roundName}`;
      const meta = `${date} · ${qCount} questions · ${mins} min`;

      return `<a class="session-row" href="/results?session=${s.id}" style="text-decoration:none;display:flex;align-items:center;gap:14px;padding:14px 10px;border-bottom:1px solid var(--line);transition:background 0.2s;border-radius:var(--radius-sm);">
        <div class="session-category-dot" style="background:${catColor}"></div>
        <div class="session-info">
          <div class="session-title" style="text-transform:capitalize">${title}</div>
          <div class="session-meta">${meta}</div>
        </div>
        <div class="session-score ${scoreClass}">${scoreText}</div>
      </a>`;
    }).join('');
  }
};
