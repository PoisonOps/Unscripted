// ─── Interview State Machine ──────────────────────────────────────────────────
const Interview = {
  // State
  setup: null,           // from sessionStorage 'us_setup'
  persona: null,
  systemPrompt: null,
  messages: [],          // [{role:'user'|'assistant', content}]
  transcript: [],        // same structure with timestamps
  questionCount: 0,
  maxQuestions: 12,
  sessionStart: null,
  tempId: null,
  state: 'idle',         // idle | speaking | listening | thinking | ended
  savedSessionId: null,
  _timerInterval: null,

  async init() {
    // Read setup from sessionStorage
    const raw = sessionStorage.getItem('us_setup');
    if (!raw) {
      window.location.href = '/';
      return;
    }
    try {
      this.setup = JSON.parse(raw);
    } catch (e) {
      window.location.href = '/';
      return;
    }

    // Temp session ID for anonymous linking
    this.tempId = sessionStorage.getItem('us_temp_session_id') || crypto.randomUUID();
    sessionStorage.setItem('us_temp_session_id', this.tempId);

    // Pick persona
    this.persona = pickPersona(this.setup.category, this.setup.roundType);
    this.setup.persona = this.persona;

    // Build system prompt
    this.systemPrompt = buildSystemPrompt(this.setup);

    // Render interviewer info in nav
    this._renderNav();

    // Init voice
    Voice.init();
    Voice.onTranscript = (text, isFinal) => this._onUserTranscript(text, isFinal);

    this.sessionStart = Date.now();
    this._startTimer();

    // Start interview: AI speaks first
    await this._aiTurn();
  },

  _renderNav() {
    const el = (id) => document.getElementById(id);
    if (el('iv-avatar'))    el('iv-avatar').textContent    = this.persona.initials;
    if (el('iv-name'))      el('iv-name').textContent      = this.persona.name;
    if (el('iv-company'))   el('iv-company').textContent   = `${this.persona.title} · ${this.setup.company || this.persona.company}`;
    if (el('iv-round-badge')) el('iv-round-badge').textContent = (this.setup.roundType || 'INTERVIEW').replace(/_/g, ' ').toUpperCase();
    if (el('iv-mode-badge')) el('iv-mode-badge').textContent = this.setup.mode === 'drill' ? 'TOPIC DRILL' : 'FULL MOCK';
    if (el('iv-q-counter')) el('iv-q-counter').textContent = `Q ${this.questionCount} / ${this.maxQuestions}`;
  },

  async _aiTurn() {
    if (this.state === 'ended') return;
    if (this.questionCount >= this.maxQuestions) {
      this._endInterview();
      return;
    }
    this._setState('thinking');
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages,
          systemPrompt: this.systemPrompt
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.response) throw new Error('No response from AI');

      const text = data.response;
      this.messages.push({ role: 'assistant', content: text });
      this.transcript.push({ role: 'assistant', content: text, ts: Date.now() });
      this.questionCount++;

      const qCounter = document.getElementById('iv-q-counter');
      if (qCounter) qCounter.textContent = `Q ${this.questionCount} / ${this.maxQuestions}`;

      this._addTranscriptItem('ai', this.persona.name, text);
      this._showQuestion(text);
      this._setState('speaking');

      Voice.speak(text, () => {
        if (this.state === 'ended') return;
        this._setState('listening');
        Voice.startListening();
      });

      // Check for interview-ending phrase from AI
      const endPhrases = ["we'll be in touch", "that's all i need", "thank you for your time", "i think we're done", "we're out of time"];
      if (endPhrases.some(p => text.toLowerCase().includes(p))) {
        // Let the speech finish, then auto-end
        setTimeout(() => {
          if (this.state !== 'ended') this._endInterview();
        }, 6000);
      }
    } catch (e) {
      console.error('[Interview] AI turn failed:', e);
      this._setState('listening');
      Voice.startListening();
      this._addTranscriptItem('ai', 'System', 'Connection issue — please try speaking or skip the question.');
    }
  },

  _onUserTranscript(text, isFinal) {
    const inputEl = document.getElementById('user-input-text');
    if (inputEl) inputEl.textContent = text;

    if (isFinal && text.trim().length > 2) {
      this.messages.push({ role: 'user', content: text });
      this.transcript.push({ role: 'user', content: text, ts: Date.now() });
      this._addTranscriptItem('user', 'You', text);
      if (inputEl) inputEl.textContent = '';
      Voice.isListening = false;
      this._aiTurn();
    }
  },

  _setState(state) {
    this.state = state;
    const label     = document.getElementById('state-label');
    const waveform  = document.getElementById('iv-waveform');
    const micIndicator = document.getElementById('mic-indicator');
    if (!label) return;

    const labels = {
      speaking:  '● INTERVIEWER SPEAKING',
      listening: '● YOUR TURN',
      thinking:  '◌ THINKING...',
      idle:      '',
      ended:     'INTERVIEW COMPLETE'
    };

    label.className = `state-label ${state}`;
    label.textContent = labels[state] || '';

    if (waveform) {
      waveform.className = 'interview-waveform';
      if (state === 'speaking')  waveform.classList.add('active');
      else if (state === 'listening') waveform.classList.add('listening');
      else waveform.classList.add('idle');
    }

    if (micIndicator) {
      micIndicator.classList.toggle('hidden', state !== 'listening');
    }
  },

  _showQuestion(text) {
    const el = document.getElementById('current-question');
    if (!el) return;
    el.classList.remove('visible');
    setTimeout(() => {
      el.textContent = text;
      el.classList.add('visible');
    }, 120);
  },

  _addTranscriptItem(type, name, text) {
    const list = document.getElementById('transcript-list');
    if (!list) return;

    // Clear placeholder on first item
    if (list.children.length === 1 && list.children[0].style.textAlign === 'center') {
      list.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = `transcript-item ${type}`;
    item.innerHTML = `<div class="t-speaker">${name.toUpperCase()}</div><div>${text}</div>`;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  },

  _startTimer() {
    const timerEl = document.getElementById('iv-timer');
    if (!timerEl) return;
    this._timerInterval = setInterval(() => {
      if (this.state === 'ended') {
        clearInterval(this._timerInterval);
        return;
      }
      const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  },

  skipQuestion() {
    if (this.state === 'ended') return;
    Voice.stop();
    const inputEl = document.getElementById('user-input-text');
    if (inputEl) inputEl.textContent = '';
    this.messages.push({ role: 'user', content: '[Skipped]' });
    this.transcript.push({ role: 'user', content: '[Skipped]', ts: Date.now() });
    this._addTranscriptItem('user', 'You', '[Skipped this question]');
    this._aiTurn();
  },

  async endInterview() {
    if (this.state === 'ended') return;
    Voice.stop();
    await this._endInterview();
  },

  async _endInterview() {
    if (this.state === 'ended') return;
    this._setState('ended');
    Voice.stop();
    clearInterval(this._timerInterval);

    const duration = Math.floor((Date.now() - this.sessionStart) / 1000);

    // Show redirect notice
    const qEl = document.getElementById('current-question');
    if (qEl) {
      qEl.classList.add('visible');
      qEl.textContent = 'Saving your session and preparing your scorecard...';
    }

    try {
      const session = await DB.saveSession({
        tempId: this.tempId,
        category: this.setup.category,
        company: this.setup.company || this.persona.company,
        role: this.setup.role || this.setup.roundType,
        roundType: this.setup.roundType,
        personality: this.setup.personality,
        mode: this.setup.mode,
        transcript: this.transcript,
        duration,
        questionCount: this.questionCount,
        contextSummary: this.setup.contextSummary || null,
      });

      if (session) {
        this.savedSessionId = session.id;
        sessionStorage.setItem('us_last_session_id', session.id);
      }

      setTimeout(() => {
        window.location.href = session
          ? `/results?session=${session.id}`
          : '/results';
      }, 1500);
    } catch (e) {
      console.error('[Interview] Failed to save session:', e);
      setTimeout(() => { window.location.href = '/results'; }, 1500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Interview.init());
