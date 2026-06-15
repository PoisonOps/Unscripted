// ─── Waveform Visualizer ─────────────────────────────────────────────────────
const Waveform = {
  bars: null, _rAF: null, _analyser: null, _audioCtx: null, _stream: null, _mode: 'idle',

  init() {
    this.bars = Array.from(document.querySelectorAll('.waveform-bar'));
    this._flat();
  },

  setSpeaking() {
    this._stopMic(); this._mode = 'speaking'; cancelAnimationFrame(this._rAF);
    document.getElementById('iv-waveform')?.setAttribute('data-mode', 'speaking');
    this._animateSpeaking();
  },

  async setListening() {
    this._mode = 'listening'; cancelAnimationFrame(this._rAF);
    document.getElementById('iv-waveform')?.setAttribute('data-mode', 'listening');
    await this._startMic(); this._animateMic();
  },

  setIdle() {
    this._stopMic(); this._mode = 'idle'; cancelAnimationFrame(this._rAF);
    document.getElementById('iv-waveform')?.setAttribute('data-mode', 'idle');
    this._flat();
  },

  _flat() {
    this.bars?.forEach(b => { b.style.transform = 'scaleY(0.07)'; b.style.opacity = '0.12'; });
  },

  async _startMic() {
    try {
      this._stream   = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src      = this._audioCtx.createMediaStreamSource(this._stream);
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 64; this._analyser.smoothingTimeConstant = 0.75;
      src.connect(this._analyser);
    } catch (_) { this._analyser = null; }
  },

  _stopMic() {
    this._stream?.getTracks().forEach(t => t.stop()); this._stream = null;
    this._audioCtx?.close().catch(() => {}); this._audioCtx = null; this._analyser = null;
  },

  _animateSpeaking() {
    if (this._mode !== 'speaking' || !this.bars) return;
    const t = Date.now() / 1000, n = this.bars.length;
    this.bars.forEach((bar, i) => {
      const x = i / n;
      const v = Math.sin(x * Math.PI * 5 + t * 3.2) * 0.35
              + Math.sin(x * Math.PI * 9 + t * 5.5) * 0.20
              + Math.sin(x * Math.PI * 2 + t * 1.8) * 0.28 + 0.22;
      const s = Math.max(0.05, Math.min(1, v));
      bar.style.transform = `scaleY(${s.toFixed(3)})`; bar.style.opacity = (0.45 + s * 0.55).toFixed(3);
    });
    this._rAF = requestAnimationFrame(() => this._animateSpeaking());
  },

  _animateMic() {
    if (this._mode !== 'listening' || !this.bars) return;
    const n = this.bars.length;
    if (this._analyser) {
      const buf = new Uint8Array(this._analyser.frequencyBinCount);
      this._analyser.getByteFrequencyData(buf);
      this.bars.forEach((bar, i) => {
        const idx = Math.floor(i * buf.length / n);
        const s   = Math.max(0.05, (buf[idx] / 255) * 0.92 + 0.05);
        bar.style.transform = `scaleY(${s.toFixed(3)})`; bar.style.opacity = (0.38 + s * 0.62).toFixed(3);
      });
    } else {
      const t = Date.now() / 1000;
      this.bars.forEach((bar, i) => {
        const s = 0.05 + Math.abs(Math.sin(i * 0.6 + t * 2.2)) * 0.12;
        bar.style.transform = `scaleY(${s.toFixed(3)})`; bar.style.opacity = '0.28';
      });
    }
    this._rAF = requestAnimationFrame(() => this._animateMic());
  },
};

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

    // Init voice + waveform
    Voice.init();
    Voice.onTranscript = (text, isFinal) => this._onUserTranscript(text, isFinal);
    Waveform.init();

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
      }, this.persona.gender || 'male');

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

    if (state === 'speaking')        Waveform.setSpeaking();
    else if (state === 'listening')  Waveform.setListening();
    else                             Waveform.setIdle();

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
