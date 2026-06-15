// ─── Round types per category ─────────────────────────────────────────────────
const ROUND_TYPES_BY_CAT = {
  campus:      [
    { value: 'technical_screening', label: 'Technical Screening' },
    { value: 'technical_deep',      label: 'Technical Deep Dive' },
    { value: 'hr',                  label: 'HR Round' },
    { value: 'final_round',         label: 'Final Round' },
  ],
  job:         [
    { value: 'technical_screening', label: 'Technical / Domain Screening' },
    { value: 'technical_deep',      label: 'Technical / Domain Deep Dive' },
    { value: 'hr',                  label: 'HR Round' },
    { value: 'final_round',         label: 'Final Round' },
  ],
  mba:         [
    { value: 'gd_pi',       label: 'Personal Interview (PI)' },
    { value: 'hr',          label: 'GD / WAT Prep' },
    { value: 'final_round', label: 'Final PI Round' },
  ],
  ms:          [
    { value: 'interview',           label: 'Admission Interview' },
    { value: 'technical_screening', label: 'Research / Faculty Interview' },
    { value: 'hr',                  label: 'Funding / Advisor Chat' },
  ],
  upsc:        [
    { value: 'personality', label: 'Personality Test (Interview)' },
  ],
  scholarship: [
    { value: 'interview',           label: 'Panel Interview' },
    { value: 'technical_screening', label: 'One-on-One Interview' },
    { value: 'hr',                  label: 'Video / Online Interview' },
  ],
};

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
      if (nextStep === 3) this._renderStep3();
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
        <div class="field"><label>Degree / Course</label>
          <select id="ctx-degree">
            <option value="">Select degree</option>
            <option>BTech / BE</option>
            <option>BCom</option>
            <option>BBA</option>
            <option>BA / BSc</option>
            <option>BCA</option>
            <option>MBA (Campus)</option>
            <option>MCA</option>
            <option>Diploma</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field"><label>Branch / Stream / Specialisation</label>
          <input type="text" id="ctx-branch" placeholder="e.g. Computer Science · Finance · Marketing · History · Electronics…">
        </div>
        <div class="field"><label>CGPA / Percentage</label><input type="text" id="ctx-cgpa" placeholder="e.g. 8.2 CGPA or 78%"></div>
        <div class="option-group"><div class="option-group-label">Target Company Type</div>
          <div class="option-pills">
            ${['IT/Software','Core Engineering','Consulting','Finance/BFSI','FMCG/Consumer','Media/Content','Government PSU','Startup']
              .map(t => `<button class="option-pill" data-group="companyType" data-value="${t}" onclick="Setup.selectOption('companyType','${t}')">${t}</button>`).join('')}
          </div>
        </div>`,

      job: `${cvUpload}
        <div class="field"><label>Industry / Domain</label>
          <select id="ctx-industry">
            <option value="">Select domain</option>
            <option>IT / Software</option>
            <option>Finance / Banking / BFSI</option>
            <option>Marketing / Growth</option>
            <option>Sales / Business Development</option>
            <option>Operations / Supply Chain</option>
            <option>Human Resources</option>
            <option>Consulting</option>
            <option>Healthcare / Pharma</option>
            <option>Product Management</option>
            <option>Design / UX</option>
            <option>Law / Legal</option>
            <option>Education / EdTech</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field"><label>Current Role & Company</label><input type="text" id="ctx-currentRole" placeholder="e.g. Financial Analyst at HDFC · Marketing Manager at Unilever"></div>
        <div class="field"><label>Years of Experience</label><input type="number" id="ctx-yearsExp" placeholder="e.g. 3" min="0" max="40"></div>
        <div class="field"><label>Target Role</label><input type="text" id="ctx-targetRole" placeholder="e.g. Senior Product Manager · Investment Banking Associate"></div>
        <div class="field"><label>Why switching? (optional)</label><textarea id="ctx-whySwitching" placeholder="Be honest — the AI will probe this..."></textarea></div>`,

      mba: `
        <div class="field"><label>CAT / GMAT / GRE Score & Percentile</label><input type="text" id="ctx-catScore" placeholder="e.g. CAT 98.5%ile · GMAT 720 · GRE 325"></div>
        <div class="field"><label>Work Experience (years)</label><input type="number" id="ctx-workEx" placeholder="e.g. 2" min="0" max="20"></div>
        <div class="field"><label>Industry & Role (current/last)</label><input type="text" id="ctx-mbaCurrentRole" placeholder="e.g. Software Engineer at TCS · CA at Deloitte · Army Officer"></div>
        <div class="field"><label>Graduation Degree, Stream & Percentage</label><input type="text" id="ctx-gradPercent" placeholder="e.g. BTech CSE 78% · BCom Finance 8.2 CGPA"></div>
        <div class="field"><label>Why MBA? (write freely)</label><textarea id="ctx-whyMba" placeholder="The AI will probe this hard — write your real answer, not the polished one"></textarea></div>`,

      ms: `
        <div class="field"><label>Program & Field of Study</label><input type="text" id="ctx-msProgram" placeholder="e.g. MSCS · MS Financial Engineering · PhD Neuroscience · MEng Robotics"></div>
        <div class="field"><label>Target Country / Region</label>
          <select id="ctx-targetCountry">
            <option value="">Select</option>
            <option>USA</option>
            <option>UK</option>
            <option>Canada</option>
            <option>Germany</option>
            <option>Australia</option>
            <option>Singapore / Asia</option>
            <option>Europe (Other)</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field"><label>Statement of Purpose (paste text or summary)</label><textarea id="ctx-sop" style="min-height:120px" placeholder="Paste your SOP or a summary of your research interests and goals..."></textarea></div>
        <div class="field"><label>GRE / GMAT Score</label><input type="text" id="ctx-greScore" placeholder="e.g. GRE 325 (V:158 Q:167) · GMAT 720"></div>
        <div class="field"><label>CGPA / Percentage</label><input type="text" id="ctx-cgpa" placeholder="e.g. 8.6 CGPA · 82%"></div>
        <div class="field"><label>Research / Key Projects</label><textarea id="ctx-research" placeholder="Briefly describe your research experience, publications, or key projects..."></textarea></div>`,

      upsc: `
        <div class="field"><label>Mains Optional Subject</label><input type="text" id="ctx-optional" placeholder="e.g. History · Public Administration · Sociology · PSIR · Geography · Law"></div>
        <div class="field"><label>Preferred Service (optional)</label>
          <select id="ctx-preferredService">
            <option value="">Select (optional)</option>
            <option>IAS – Indian Administrative Service</option>
            <option>IPS – Indian Police Service</option>
            <option>IFS – Indian Foreign Service</option>
            <option>IRS – Indian Revenue Service</option>
            <option>IFoS – Indian Forest Service</option>
            <option>Other Central Service</option>
          </select>
        </div>
        <div class="field"><label>Home State</label><input type="text" id="ctx-homeState" placeholder="e.g. Maharashtra, Rajasthan, Tamil Nadu"></div>
        <div class="field"><label>Graduation Degree & Subject</label><input type="text" id="ctx-gradSubject" placeholder="e.g. BTech Mechanical · BA History · MBBS · LLB"></div>
        <div class="field"><label>Hobbies & Interests (from DAF)</label><textarea id="ctx-hobbies" placeholder="e.g. Classical music, trekking, social work — paste exactly as in your DAF"></textarea></div>`,

      scholarship: `
        <div class="field"><label>Scholarship Name / Type</label>
          <select id="ctx-scholarshipType">
            <option value="">Select type</option>
            <option>Government / National (e.g. PMRF, NTS, NSP)</option>
            <option>International (e.g. Fulbright, Rhodes, Chevening, DAAD)</option>
            <option>Private / Foundation (e.g. Tata, Inlaks, Aga Khan)</option>
            <option>Research Fellowship (e.g. CSIR, DST, INSPIRE)</option>
            <option>Sports / Cultural / Arts</option>
            <option>Need-based / Financial Aid</option>
          </select>
        </div>
        <div class="field"><label>Target Scholarship (specific name)</label><input type="text" id="ctx-targetScholarship" placeholder="e.g. PM Research Fellowship · Fulbright-Nehru · Rhodes Scholarship"></div>
        <div class="field"><label>Academic Level</label>
          <select id="ctx-academicLevel">
            <option value="">Select</option>
            <option>Undergraduate (UG)</option>
            <option>Postgraduate / Masters</option>
            <option>Doctoral / PhD</option>
            <option>Postdoctoral</option>
          </select>
        </div>
        <div class="field"><label>Field / Subject</label><input type="text" id="ctx-scholarshipField" placeholder="e.g. Computer Science · Economics · Literature · Medicine · Fine Arts"></div>
        <div class="field"><label>Key Academic Achievements</label><textarea id="ctx-achievements" placeholder="Rank, previous scholarships, awards, publications, olympiad medals..."></textarea></div>
        <div class="field"><label>Projects / Research / Work</label><textarea id="ctx-projects" placeholder="What have you built, investigated, or contributed to?"></textarea></div>`,
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

  _renderStep3() {
    const cat = this.data.category;
    const types = ROUND_TYPES_BY_CAT[cat] || ROUND_TYPES_BY_CAT['campus'];

    // Set a sensible default round type for the category
    const defaultType = types[0].value;
    if (!types.find(t => t.value === this.data.roundType)) {
      this.data.roundType = defaultType;
    }

    const container = document.getElementById('round-type-pills');
    if (!container) return;
    container.innerHTML = types.map(t =>
      `<button class="option-pill${this.data.roundType === t.value ? ' selected' : ''}" data-group="roundType" data-value="${t.value}" onclick="Setup.selectOption('roundType','${t.value}')">${t.label}</button>`
    ).join('');
  },

  _readContextData() {
    const get = id => document.getElementById(id)?.value?.trim() || null;
    this.data.contextData = {
      // campus
      degree:            get('ctx-degree'),
      cgpa:              get('ctx-cgpa'),
      branch:            get('ctx-branch'),
      companyType:       this.data.companyType || null,
      // job
      industry:          get('ctx-industry'),
      currentRole:       get('ctx-currentRole'),
      yearsExp:          get('ctx-yearsExp'),
      targetRole:        get('ctx-targetRole'),
      whySwitching:      get('ctx-whySwitching'),
      // mba
      catScore:          get('ctx-catScore'),
      mbaCurrentRole:    get('ctx-mbaCurrentRole'),
      workEx:            get('ctx-workEx'),
      gradPercent:       get('ctx-gradPercent'),
      whyMba:            get('ctx-whyMba'),
      // ms
      msProgram:         get('ctx-msProgram'),
      targetCountry:     get('ctx-targetCountry'),
      sop:               get('ctx-sop'),
      greScore:          get('ctx-greScore'),
      research:          get('ctx-research'),
      // upsc
      optional:          get('ctx-optional'),
      preferredService:  get('ctx-preferredService'),
      homeState:         get('ctx-homeState'),
      gradSubject:       get('ctx-gradSubject'),
      hobbies:           get('ctx-hobbies'),
      // scholarship
      scholarshipType:   get('ctx-scholarshipType'),
      targetScholarship: get('ctx-targetScholarship'),
      academicLevel:     get('ctx-academicLevel'),
      scholarshipField:  get('ctx-scholarshipField'),
      achievements:      get('ctx-achievements'),
      projects:          get('ctx-projects'),
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
function _setNavAuth(loggedIn) {
  const loginBtn  = document.getElementById('nav-login-btn');
  const dashBtn   = document.getElementById('nav-dash-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (loggedIn) {
    loginBtn?.classList.add('hidden');
    dashBtn?.classList.remove('hidden');
    logoutBtn?.classList.remove('hidden');
  } else {
    loginBtn?.classList.remove('hidden');
    dashBtn?.classList.add('hidden');
    logoutBtn?.classList.add('hidden');
  }
}

function confirmLogout() {
  const modal = document.getElementById('logout-modal');
  if (modal) { modal.style.display = 'flex'; }
}

async function initNav() {
  try {
    const { data: { session } } = await getClient().auth.getSession();
    _setNavAuth(!!session?.user);

    Auth.onAuthChange(async (event, u) => {
      if (event === 'SIGNED_IN' && u) {
        await Auth.handlePostSignup(u);
        _setNavAuth(true);
        closeAuthModal();
        const returnUrl = sessionStorage.getItem('us_post_auth_url');
        if (returnUrl && returnUrl !== window.location.href) {
          sessionStorage.removeItem('us_post_auth_url');
          window.location.href = returnUrl;
        }
      }
      if (event === 'SIGNED_OUT') {
        _setNavAuth(false);
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
