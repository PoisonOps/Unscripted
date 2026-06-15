// ─── Category color theming ────────────────────────────────────────────────────
const CAT_COLORS = {
  campus:      '#2563EB',
  job:         '#059669',
  mba:         '#7C3AED',
  ms:          '#0891B2',
  upsc:        '#DC2626',
  scholarship: '#D97706',
};
function applyCatTheme(cat) {
  const color = CAT_COLORS[cat] || '#FF3B5C';
  document.documentElement.style.setProperty('--cat-color', color);
  document.documentElement.style.setProperty('--cat-bg', color + '18');
}

// ─── Setup Wizard ──────────────────────────────────────────────────────────────
const Setup = {
  currentStep: 1,
  totalSteps:  4,
  data: {
    category:       null,
    roundType:      'technical_screening',
    mode:           'full_mock',
    personality:    'balanced',
    company:        '',
    contextData:    {},
    resumeText:     null,
    contextSummary: '',
  },

  open(cat) {
    document.getElementById('setup-modal').classList.add('open');
    this.goTo(1);
    if (cat) {
      this.selectCategory(cat);
    }
  },

  close() {
    document.getElementById('setup-modal').classList.remove('open');
  },

  goTo(step) {
    this.currentStep = step;
    document.querySelectorAll('.setup-step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === step);
    });
    document.querySelectorAll('.setup-progress-dot').forEach((el, i) => {
      el.classList.toggle('active', i < step);
    });
  },

  next() {
    if (this.currentStep === 1 && !this.data.category) {
      showToast('Pick an interview type first', 'error');
      return;
    }
    const nextStep = this.currentStep + 1;
    if (nextStep <= this.totalSteps) {
      if (nextStep === 2) this._renderContextFields();
      this.goTo(nextStep);
      if (nextStep === 4) {
        this._readContextData();
        this._renderSummary();
      }
    }
  },

  back() {
    if (this.currentStep > 1) this.goTo(this.currentStep - 1);
  },

  selectCategory(cat) {
    this.data.category = cat;
    document.querySelectorAll('.cat-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.cat === cat);
    });
    applyCatTheme(cat);
  },

  selectOption(group, value) {
    this.data[group] = value;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(el => {
      el.classList.toggle('selected', el.dataset.value === value);
    });
  },

  _renderContextFields() {
    const container = document.getElementById('context-fields-container');
    if (!container) return;
    const cat = this.data.category;

    const cvUpload = `
      <div class="upload-zone" id="cv-upload-zone">
        <input type="file" id="cv-file" accept=".pdf">
        <div class="upload-zone-icon">📄</div>
        <div class="upload-zone-text">Upload your CV / Resume</div>
        <div class="upload-zone-hint">PDF only · parsed locally · never stored as a file</div>
      </div>`;

    const fields = {
      campus: `${cvUpload}
        <div class="field"><label>CGPA / Percentage</label><input type="text" id="ctx-cgpa" placeholder="e.g. 8.2 or 78%"></div>
        <div class="field"><label>Branch / Stream</label>
          <select id="ctx-branch">
            <option value="">Select branch</option>
            <option>Civil Engineering</option><option>Mechanical Engineering</option>
            <option>Electrical Engineering</option><option>Computer Science</option>
            <option>Electronics & Communication</option><option>Chemical Engineering</option>
            <option>Information Technology</option><option>Other</option>
          </select>
        </div>
        <div class="option-group"><div class="option-group-label">Target Company Type</div>
          <div class="option-pills">
            ${['Core Engineering','IT/Software','Consulting','Finance/BFSI','FMCG/Consumer','Government PSU']
              .map(t => `<button class="option-pill" data-group="companyType" data-value="${t}" onclick="Setup.selectOption('companyType','${t}')">${t}</button>`).join('')}
          </div>
        </div>`,

      job: `${cvUpload}
        <div class="field"><label>Current Role & Company</label><input type="text" id="ctx-currentRole" placeholder="e.g. Software Engineer at Infosys"></div>
        <div class="field"><label>Years of Experience</label><input type="number" id="ctx-yearsExp" placeholder="e.g. 3" min="0" max="40"></div>
        <div class="field"><label>Target Role</label><input type="text" id="ctx-targetRole" placeholder="e.g. Product Manager at a startup"></div>
        <div class="field"><label>Why switching? (optional)</label><textarea id="ctx-whySwitching" placeholder="Be honest — the AI will probe this..."></textarea></div>`,

      mba: `
        <div class="field"><label>CAT / GMAT Score & Percentile</label><input type="text" id="ctx-catScore" placeholder="e.g. 98.5%ile or GMAT 720"></div>
        <div class="field"><label>Work Experience (years)</label><input type="number" id="ctx-workEx" placeholder="e.g. 2" min="0" max="20"></div>
        <div class="field"><label>Graduation Percentage / CGPA</label><input type="text" id="ctx-gradPercent" placeholder="e.g. 75% or 7.8 CGPA"></div>
        <div class="field"><label>Why MBA? (write freely)</label><textarea id="ctx-whyMba" placeholder="The AI will probe this hard — write your real answer, not the polished one"></textarea></div>`,

      ms: `
        <div class="field"><label>Statement of Purpose (paste text)</label><textarea id="ctx-sop" style="min-height:120px" placeholder="Paste your SOP or a summary of your research interests..."></textarea></div>
        <div class="field"><label>GRE / GMAT Score</label><input type="text" id="ctx-greScore" placeholder="e.g. GRE 325 (V:158 Q:167)"></div>
        <div class="field"><label>CGPA / Percentage</label><input type="text" id="ctx-cgpa" placeholder="e.g. 8.6 CGPA"></div>
        <div class="field"><label>Research / Key Projects</label><textarea id="ctx-research" placeholder="Briefly describe your research experience or key projects..."></textarea></div>`,

      upsc: `
        <div class="field"><label>Home State</label><input type="text" id="ctx-homeState" placeholder="e.g. Maharashtra"></div>
        <div class="field"><label>Graduation Subject</label><input type="text" id="ctx-gradSubject" placeholder="e.g. History, Engineering, Commerce"></div>
        <div class="field"><label>Hobbies & Interests (from DAF)</label><textarea id="ctx-hobbies" placeholder="e.g. Classical music, trekking, social work — be specific"></textarea></div>`,

      scholarship: `
        <div class="field"><label>Key Academic Achievements</label><textarea id="ctx-achievements" placeholder="Rank, scholarships, awards, publications..."></textarea></div>
        <div class="field"><label>Projects / Research</label><textarea id="ctx-projects" placeholder="What have you built or investigated?"></textarea></div>
        <div class="field"><label>Target Scholarship</label><input type="text" id="ctx-targetScholarship" placeholder="e.g. PM Research Fellowship, Fulbright, Rhodes..."></div>`,
    };

    container.innerHTML = fields[cat] || `<p style="color:var(--text-dim);text-align:center;padding:20px 0">No additional context needed — you're all set.</p>`;

    const fileInput = document.getElementById('cv-file');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const zone = document.getElementById('cv-upload-zone');
        if (zone) {
          zone.classList.add('has-file');
          const textEl = zone.querySelector('.upload-zone-text');
          if (textEl) textEl.textContent = `Parsing ${file.name}...`;
        }
        const text = await Resume.parse(file);
        Setup.data.resumeText = text;
        if (zone) {
          const textEl = zone.querySelector('.upload-zone-text');
          if (textEl) textEl.textContent = text
            ? `✓ ${file.name} (${Math.round(text.length / 100) / 10}k chars)`
            : 'Could not parse — try another PDF';
        }
      });
    }
  },

  _readContextData() {
    const get = id => document.getElementById(id)?.value?.trim() || null;
    this.data.contextData = {
      cgpa:              get('ctx-cgpa'),
      branch:            get('ctx-branch'),
      companyType:       this.data.companyType || null,
      currentRole:       get('ctx-currentRole'),
      yearsExp:          get('ctx-yearsExp'),
      targetRole:        get('ctx-targetRole'),
      whySwitching:      get('ctx-whySwitching'),
      catScore:          get('ctx-catScore'),
      workEx:            get('ctx-workEx'),
      gradPercent:       get('ctx-gradPercent'),
      whyMba:            get('ctx-whyMba'),
      sop:               get('ctx-sop'),
      greScore:          get('ctx-greScore'),
      research:          get('ctx-research'),
      homeState:         get('ctx-homeState'),
      gradSubject:       get('ctx-gradSubject'),
      hobbies:           get('ctx-hobbies'),
      achievements:      get('ctx-achievements'),
      projects:          get('ctx-projects'),
      targetScholarship: get('ctx-targetScholarship'),
    };
    this.data.company = get('ctx-company') || '';
    this.data.contextSummary = Object.entries(this.data.contextData)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  },

  _renderSummary() {
    const CAT_NAMES = {
      campus: 'Campus Placement', job: 'Job Switch', mba: 'MBA GD-PI',
      ms: 'Foreign MS/PhD', upsc: 'UPSC', scholarship: 'Scholarship',
    };
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('summary-category',    CAT_NAMES[this.data.category] || this.data.category || '—');
    set('summary-round',       (this.data.roundType || '—').replace(/_/g, ' '));
    set('summary-mode',        this.data.mode === 'drill' ? 'Topic Drill' : 'Full Mock');
    set('summary-personality', this.data.personality || 'balanced');
    set('summary-company',     this.data.company || 'Not specified');
    set('summary-resume',      this.data.resumeText ? '✓ Parsed' : 'Not uploaded');
  },

  startInterview() {
    this._readContextData();
    sessionStorage.setItem('us_setup', JSON.stringify(this.data));
    window.location.href = '/interview';
  },
};

// ─── Nav auth state ────────────────────────────────────────────────────────────
async function initNav() {
  try {
    const user = await Auth.getUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const dashBtn  = document.getElementById('nav-dash-btn');
    if (user) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (dashBtn)  dashBtn.classList.remove('hidden');
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (dashBtn)  dashBtn.classList.add('hidden');
    }
    Auth.onAuthChange(async (event, u) => {
      if (event === 'SIGNED_IN' && u) {
        await Auth.handlePostSignup(u);
        if (loginBtn) loginBtn.classList.add('hidden');
        if (dashBtn)  dashBtn.classList.remove('hidden');
        closeAuthModal();
        // Return to page user was on before Google OAuth redirect
        const returnUrl = sessionStorage.getItem('us_post_auth_url');
        if (returnUrl && returnUrl !== window.location.href) {
          sessionStorage.removeItem('us_post_auth_url');
          window.location.href = returnUrl;
        }
      }
      if (event === 'SIGNED_OUT') {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (dashBtn)  dashBtn.classList.add('hidden');
      }
    });
  } catch (e) {
    if (typeof log === 'function') log('initNav error', e);
  }
}

// ─── Auth modal ────────────────────────────────────────────────────────────────
function openAuthModal(defaultTab) {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('open');
  switchAuthTab(defaultTab || 'login');
}
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
}
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  if (loginForm)  loginForm.classList.toggle('hidden', tab !== 'login');
  if (signupForm) signupForm.classList.toggle('hidden', tab !== 'signup');
}
async function handleLogin() {
  const email    = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const errEl    = document.getElementById('login-error');
  if (errEl) errEl.textContent = '';
  if (!email || !password) {
    if (errEl) errEl.textContent = 'Enter email and password.';
    return;
  }
  try {
    await Auth.loginWithEmail(email, password);
  } catch (e) {
    if (errEl) errEl.textContent = e.message || 'Login failed. Check your credentials.';
  }
}
async function handleSignup() {
  const name     = document.getElementById('signup-name')?.value?.trim();
  const email    = document.getElementById('signup-email')?.value?.trim();
  const password = document.getElementById('signup-password')?.value;
  const errEl    = document.getElementById('signup-error');
  if (errEl) errEl.textContent = '';
  if (!name || !email || !password) {
    if (errEl) errEl.textContent = 'All fields are required.';
    return;
  }
  if (password.length < 6) {
    if (errEl) errEl.textContent = 'Password must be at least 6 characters.';
    return;
  }
  try {
    await Auth.signupWithEmail(email, password, name);
  } catch (e) {
    const msg = (e.message || '');
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('security purposes') || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('registered')) {
      const loginEmail = document.getElementById('login-email');
      const loginErr   = document.getElementById('login-error');
      if (loginEmail) loginEmail.value = email;
      if (loginErr)   loginErr.textContent = 'This email already has an account. Enter your password below.';
      switchAuthTab('login');
    } else {
      if (errEl) errEl.textContent = msg || 'Signup failed. Try again.';
    }
  }
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `show ${type || ''}`;
  setTimeout(() => { el.className = ''; }, 3000);
}

// ─── Nav scroll (transparent → solid) ─────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── Hero mouse spotlight ──────────────────────────────────────────────────────
function initHeroSpotlight() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    hero.style.setProperty('--mx', x.toString());
    hero.style.setProperty('--my', y.toString());
  });
}

// ─── Typing effect (hero card) ─────────────────────────────────────────────────
const SAMPLE_QUESTIONS = [
  '"Walk me through your final year project — what was your specific contribution?"',
  '"I see you interned at Gammon India. How would that experience scale to an L&T project?"',
  '"You said you work well under pressure. Give me a concrete example."',
  '"Your CGPA is 7.4. Why should we hire you over someone with 8.5?"',
  '"Why L&T specifically? What have you researched about our current projects?"',
  '"That answer sounds rehearsed. Tell me what actually happened."',
  '"What\'s the most complex problem you\'ve personally solved? Walk me through it."',
];

function initTypingEffect() {
  const el = document.getElementById('typing-text');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = SAMPLE_QUESTIONS[0];
    return;
  }
  let qi = 0, ci = 0, typing = true, paused = false;
  function tick() {
    if (paused) { setTimeout(tick, 100); return; }
    const q = SAMPLE_QUESTIONS[qi];
    if (typing) {
      if (ci < q.length) {
        el.textContent = q.slice(0, ++ci);
        setTimeout(tick, 28);
      } else {
        typing = false; paused = true;
        setTimeout(() => { paused = false; setTimeout(tick, 80); }, 2400);
      }
    } else {
      if (ci > 0) {
        el.textContent = q.slice(0, --ci);
        setTimeout(tick, 14);
      } else {
        typing = true;
        qi = (qi + 1) % SAMPLE_QUESTIONS.length;
        setTimeout(tick, 400);
      }
    }
  }
  setTimeout(tick, 900);
}

// ─── Magnetic buttons ──────────────────────────────────────────────────────────
function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.magnetic').forEach(wrap => {
    const btn = wrap.querySelector('button, a');
    if (!btn) return;
    wrap.addEventListener('mousemove', e => {
      const r  = wrap.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * 0.3;
      const dy = (e.clientY - r.top  - r.height / 2) * 0.3;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    wrap.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// ─── Card tilt on hover ────────────────────────────────────────────────────────
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientY - r.top  - r.height / 2) / r.height * 8;
      const y = (e.clientX - r.left - r.width  / 2) / r.width  * -8;
      card.style.transform = `perspective(800px) translateY(-4px) rotateX(${x}deg) rotateY(${y}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ─── Custom cursor ─────────────────────────────────────────────────────────────
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.body.classList.add('no-cursor');
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = 1; ring.style.opacity = 1; });

  document.querySelectorAll('a, button, [onclick], .type-card, .cat-card, input, select, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  (function animate() {
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animate);
  })();
}

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => obs.observe(el));
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNavScroll();
  initCursor();
  initScrollReveal();
  initHeroSpotlight();
  initTypingEffect();
  initMagnetic();
  initCardTilt();
});
