// ─── Voice Module: SpeechRecognition + SpeechSynthesis ───────────────────────
const Voice = {
  recognition:    null,
  synthesis:      window.speechSynthesis,
  isListening:    false,
  isSpeaking:     false,
  supported:      false,
  onTranscript:   null,
  _silenceTimer:  null,
  _accumText:     '',
  _silenceDelay:  1800,

  init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      this.supported = false;
      console.warn('[Voice] SpeechRecognition not supported');
      document.getElementById('no-speech-banner')?.classList.remove('hidden');
      return;
    }
    this.supported = true;
    this._initRec(SpeechRec);
    this._loadVoicesAndCache();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this._loadVoicesAndCache();
    }
  },

  _initRec(SpeechRec) {
    this.recognition = new SpeechRec();
    this.recognition.continuous      = true;
    this.recognition.interimResults  = true;
    this.recognition.lang            = 'en-IN';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e) => {
      let newFinal = '';
      let interim  = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) newFinal += t + ' ';
        else interim += t;
      }

      this._accumText += newFinal;
      const display = (this._accumText + interim).trim();
      if (this.onTranscript) this.onTranscript(display, false);

      clearTimeout(this._silenceTimer);
      this._silenceTimer = setTimeout(() => {
        const final = this._accumText.trim() || interim.trim();
        this._accumText = '';
        if (final.length > 3 && this.onTranscript) {
          this.onTranscript(final, true);
        }
      }, this._silenceDelay);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try { this.recognition.start(); } catch (_) {}
      }
    };

    this.recognition.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'no-speech') {
        if (this.isListening) try { this.recognition.start(); } catch (_) {}
        return;
      }
      console.warn('[Voice] Recognition error:', e.error);
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) try { this.recognition.start(); } catch (_) {}
        }, 600);
      }
    };
  },

  _FEMALE: ['samantha', 'karen', 'victoria', 'moira', 'tessa', 'serena', 'fiona',
             'hazel', 'susan', 'zira', 'google uk english female', 'google us english'],
  _MALE:   ['daniel', 'alex', 'james', 'tom', 'rishi', 'oliver', 'mark',
             'google uk english male', 'david', 'microsoft david'],

  // Cache male + female voice once voices load — prevents switching mid-session
  _voiceCache: {},

  _loadVoicesAndCache() {
    const voices = this.synthesis.getVoices().filter(v => v.lang.startsWith('en'));
    if (!voices.length) return;
    this._voiceCache.male   = this._selectVoice(voices, 'male');
    this._voiceCache.female = this._selectVoice(voices, 'female');
  },

  _selectVoice(voices, gender) {
    const pref = gender === 'female' ? this._FEMALE : this._MALE;
    const fall = gender === 'female' ? this._MALE   : this._FEMALE;
    for (const n of pref) { const v = voices.find(v => v.name.toLowerCase().includes(n)); if (v) return v; }
    for (const n of fall) { const v = voices.find(v => v.name.toLowerCase().includes(n)); if (v) return v; }
    return voices[0];
  },

  _pickVoice(gender) {
    // Always return cached voice — ensures same voice throughout the session
    const cached = this._voiceCache[gender];
    if (cached) return cached;
    // Voices not yet cached — select on the fly and cache now
    const voices = this.synthesis.getVoices().filter(v => v.lang.startsWith('en'));
    if (!voices.length) return null;
    const v = this._selectVoice(voices, gender);
    this._voiceCache[gender] = v;
    return v;
  },

  startListening() {
    if (!this.supported || this.isListening) return;
    this.synthesis.cancel();
    this.isSpeaking  = false;
    this._accumText  = '';
    clearTimeout(this._silenceTimer);
    this.isListening = true;
    try { this.recognition.start(); } catch (_) {}
  },

  stopListening() {
    if (!this.supported) return;
    this.isListening = false;
    clearTimeout(this._silenceTimer);
    this._accumText  = '';
    try { this.recognition.stop(); } catch (_) {}
  },

  speak(text, onEnd, gender) {
    gender = gender || 'male';
    if (!text) { if (onEnd) onEnd(); return; }
    // Mute mic while AI speaks — prevents recognition picking up TTS audio
    this.stopListening();
    this.synthesis.cancel();
    this.isSpeaking = true;
    if (text.length > 200) { this._speakChunked(text, onEnd, gender); return; }
    this._speakOne(text, gender, onEnd);
  },

  _speakOne(text, gender, onEnd) {
    const utt   = new SpeechSynthesisUtterance(text);
    utt.rate    = 0.95;
    utt.pitch   = gender === 'female' ? 1.08 : 0.93;
    utt.volume  = 1;
    const voice = this._pickVoice(gender);
    if (voice) utt.voice = voice;
    utt.onend   = () => { this.isSpeaking = false; if (onEnd) onEnd(); };
    utt.onerror = (e) => {
      this.isSpeaking = false;
      console.warn('[Voice] TTS error:', e.error);
      if (onEnd) onEnd();
    };
    this.synthesis.speak(utt);
  },

  _speakChunked(text, onEnd, gender) {
    const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let i = 0;
    const next = () => {
      if (i >= parts.length) { this.isSpeaking = false; if (onEnd) onEnd(); return; }
      const chunk = parts[i++].trim();
      if (!chunk) { next(); return; }
      const utt   = new SpeechSynthesisUtterance(chunk);
      utt.rate    = 0.95;
      utt.pitch   = gender === 'female' ? 1.08 : 0.93;
      utt.volume  = 1;
      const voice = this._pickVoice(gender);
      if (voice) utt.voice = voice;
      utt.onend   = next;
      utt.onerror = () => { this.isSpeaking = false; if (onEnd) onEnd(); };
      this.synthesis.speak(utt);
    };
    next();
  },

  stop() {
    this.synthesis.cancel();
    this.stopListening();
    this.isSpeaking = false;
  }
};
