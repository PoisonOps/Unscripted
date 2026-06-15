// ─── Results Page ─────────────────────────────────────────────────────────────
const Results = {
  sessionId: null,
  session: null,

  async init() {
    // Handle OAuth error redirect (e.g. Google OAuth failed)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error')) {
      const errCode = urlParams.get('error_code') || '';
      const errDesc = urlParams.get('error_description') || '';
      // Clean the URL then show gate with a helpful message
      window.history.replaceState({}, '', '/results');
      document.getElementById('results-gate').classList.remove('hidden');
      document.getElementById('results-content').classList.add('hidden');
      const gateEl = document.getElementById('results-gate');
      const notice = gateEl.querySelector('.oauth-error-notice') || document.createElement('p');
      notice.className = 'oauth-error-notice';
      notice.style.cssText = 'color:var(--danger);font-size:0.82rem;font-family:var(--font-mono);margin-bottom:12px;text-align:center;';
      notice.textContent = errCode === 'unexpected_failure'
        ? 'Google sign-in failed — try email signup instead, or check your Google account settings.'
        : `Sign-in error: ${errDesc || errCode}. Please try again.`;
      gateEl.prepend(notice);
      openAuthModal('signup');
      return;
    }

    this.sessionId = urlParams.get('session');
    const user = await Auth.getUser();

    if (!user) {
      // Show auth gate
      document.getElementById('results-gate').classList.remove('hidden');
      document.getElementById('results-content').classList.add('hidden');

      // After login, reload page to show results
      Auth.onAuthChange(async (event, u) => {
        if (event === 'SIGNED_IN' && u) {
          await Auth.handlePostSignup(u);
          window.location.reload();
        }
      });
      return;
    }

    // User logged in — show results
    document.getElementById('results-gate').classList.add('hidden');
    document.getElementById('results-content').classList.remove('hidden');

    // Link anonymous session to this user if needed
    await Auth.handlePostSignup(user);

    if (this.sessionId) {
      await this.loadAndScore();
    } else {
      // No session ID — check if there's one in sessionStorage
      const lastId = sessionStorage.getItem('us_last_session_id');
      if (lastId) {
        this.sessionId = lastId;
        window.history.replaceState({}, '', `/results?session=${lastId}`);
        await this.loadAndScore();
      } else {
        this._showNoSession();
      }
    }
  },

  _showNoSession() {
    document.getElementById('scoring-state').classList.add('hidden');
    document.getElementById('scorecard').classList.add('hidden');
    const content = document.getElementById('results-content');
    if (content) {
      const notice = document.createElement('div');
      notice.style.cssText = 'text-align:center;padding:60px 20px;';
      notice.innerHTML = `
        <div style="font-family:var(--font-display);font-style:italic;font-size:1.5rem;margin-bottom:12px;color:var(--text)">No session found</div>
        <p style="color:var(--text-dim);margin-bottom:24px">We couldn't find this interview session.</p>
        <a href="/" class="btn btn-primary">Start a new interview</a>
      `;
      content.prepend(notice);
    }
  },

  async loadAndScore() {
    this.session = await DB.getSession(this.sessionId);
    if (!this.session) {
      this._showNoSession();
      return;
    }

    // If already scored, render directly
    if (this.session.scores) {
      document.getElementById('scoring-state').classList.add('hidden');
      document.getElementById('scorecard').classList.remove('hidden');
      this.renderScorecard(this.session.scores);
      return;
    }

    // Need to score — show loading state
    document.getElementById('scoring-state').classList.remove('hidden');
    document.getElementById('scorecard').classList.add('hidden');

    try {
      const transcript = this.session.transcript || [];
      if (!transcript.length) {
        this._showEmptyTranscript();
        return;
      }

      const scoringPrompt = buildScoringPrompt(transcript, {
        category: this.session.category,
        roundType: this.session.round_type,
        personality: this.session.personality,
      });

      const r = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Score this interview based on the transcript provided in the system prompt.' }],
          systemPrompt: scoringPrompt
        })
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();

      // Extract JSON from response
      let scores = null;
      const raw = d.response || '';

      // Try to parse JSON directly
      try {
        scores = JSON.parse(raw);
      } catch (_) {
        // Try to extract JSON object from text
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { scores = JSON.parse(jsonMatch[0]); }
          catch (_2) { console.error('[Results] Failed to parse scores JSON:', jsonMatch[0]); }
        }
      }

      if (scores) {
        await DB.saveScores(this.sessionId, scores);
        document.getElementById('scoring-state').classList.add('hidden');
        document.getElementById('scorecard').classList.remove('hidden');
        this.renderScorecard(scores);
        DB.logEvent('session_scored', { session_id: this.sessionId });
      } else {
        this._showScoringError();
      }
    } catch (e) {
      console.error('[Results] Scoring failed:', e);
      this._showScoringError();
    }
  },

  _showEmptyTranscript() {
    document.getElementById('scoring-state').innerHTML = `
      <div style="font-family:var(--font-display);font-style:italic;font-size:1.2rem;color:var(--text);margin-bottom:12px">No transcript recorded</div>
      <p style="color:var(--text-dim);margin-bottom:24px;font-size:0.9rem">It looks like the interview session was empty — no voice exchanges were recorded.</p>
      <a href="/" class="btn btn-primary">Try again</a>
    `;
  },

  _showScoringError() {
    document.getElementById('scoring-state').innerHTML = `
      <div style="font-family:var(--font-display);font-style:italic;font-size:1.2rem;color:var(--text);margin-bottom:12px">Scoring unavailable</div>
      <p style="color:var(--text-dim);margin-bottom:24px;font-size:0.9rem">We couldn't analyse this session right now. Try refreshing in a minute.</p>
      <button class="btn btn-outline" onclick="window.location.reload()">Retry</button>
    `;
  },

  renderScorecard(scores) {
    // Overall score ring
    const overall = scores.scores?.overall || 0;
    const scoreNumEl = document.getElementById('score-num');
    if (scoreNumEl) scoreNumEl.textContent = overall;

    const ringFill = document.getElementById('score-ring-fill');
    if (ringFill) {
      const circumference = 283; // 2 * PI * 45
      const offset = circumference - (overall / 100) * circumference;
      setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
      }, 300);
    }

    // Color the ring based on score
    if (ringFill) {
      if (overall >= 70) ringFill.style.stroke = 'var(--success)';
      else if (overall >= 50) ringFill.style.stroke = 'var(--accent)';
      else ringFill.style.stroke = 'var(--danger)';
    }

    // Dimension bars
    const dims = ['technical', 'communication', 'confidence', 'relevance', 'preparation'];
    dims.forEach(dim => {
      const val = scores.scores?.[dim] || 0;
      const bar   = document.getElementById(`bar-${dim}`);
      const score = document.getElementById(`score-${dim}`);
      if (bar) {
        setTimeout(() => { bar.style.width = `${val * 10}%`; }, 500);
        // Color by value
        if (val >= 7) bar.style.background = 'var(--success)';
        else if (val >= 5) bar.style.background = 'var(--accent)';
        else bar.style.background = 'var(--danger)';
      }
      if (score) score.textContent = `${val}/10`;
    });

    // Strong & weak moments
    const momentsEl = document.getElementById('moments-grid');
    if (momentsEl) {
      momentsEl.innerHTML = '';
      const strong = scores.strong || [];
      const weak   = scores.weak   || [];
      strong.forEach(m => {
        const card = document.createElement('div');
        card.className = 'moment-card strong';
        card.innerHTML = `<div class="moment-label">● STRONG MOMENT</div><div class="moment-q t-small">"${m.question}"</div><div class="moment-insight">${m.insight}</div>`;
        momentsEl.appendChild(card);
      });
      weak.forEach(m => {
        const card = document.createElement('div');
        card.className = 'moment-card weak';
        card.innerHTML = `<div class="moment-label">● NEEDS WORK</div><div class="moment-q t-small">"${m.question}"</div><div class="moment-insight">${m.insight}</div>`;
        momentsEl.appendChild(card);
      });
      if (!strong.length && !weak.length) {
        momentsEl.innerHTML = '<p style="color:var(--text-faint);font-size:0.85rem">No specific moments identified.</p>';
      }
    }

    // Improvement suggestions
    const impEl = document.getElementById('improvements-list');
    if (impEl) {
      const improvements = scores.improvements || [];
      if (improvements.length) {
        impEl.innerHTML = improvements.map(i => `<li>${i}</li>`).join('');
      } else {
        impEl.innerHTML = '<li>Keep practicing to build consistency across all areas.</li>';
      }
    }
  },

  async submitFeedback(data) {
    if (!this.sessionId) {
      showToast('No session to attach feedback to', 'error');
      return;
    }
    try {
      await DB.saveFeedback(this.sessionId, data);
      DB.logEvent('feedback_submitted', { session_id: this.sessionId });
      const section = document.getElementById('feedback-section');
      if (section) {
        section.innerHTML = `<div style="text-align:center;padding:24px 20px;">
          <div style="font-size:1.5rem;margin-bottom:10px;">🙏</div>
          <p style="color:var(--text-dim);font-size:0.9rem;line-height:1.6;">Thank you — this directly improves the interview quality for everyone.</p>
        </div>`;
      }
    } catch (e) {
      console.error('[Results] Feedback failed:', e);
      showToast('Failed to save feedback', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Results.init());
