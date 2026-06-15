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
    this.synthesis.getVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.synthesis.getVoices();
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

  _pickVoice(gender) {
    const voices = this.synthesis.getVoices().filter(v => v.lang.startsWith('en'));
    if (!voices.length) return null;
    const pref = gender === 'female' ? this._FEMALE : this._MALE;
    const fall = gender === 'female' ? this._MALE   : this._FEMALE;
    for (const n of pref) {
      const v = voices.find(v => v.name.toLowerCase().includes(n));
      if (v) return v;
    }
    for (const n of fall) {
      const v = voices.find(v => v.name.toLowerCase().includes(n));
      if (v) return v;
    }
    return voices[0];
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
