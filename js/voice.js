// ─── Voice Module: SpeechRecognition + SpeechSynthesis ───────────────────────
const Voice = {
  recognition: null,
  synthesis: window.speechSynthesis,
  isListening: false,
  isSpeaking: false,
  supported: false,
  onTranscript: null,  // callback(text, isFinal)
  onSpeakEnd: null,    // callback()
  _voicesLoaded: false,

  init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      this.supported = false;
      console.warn('[Voice] SpeechRecognition not supported in this browser');
      const banner = document.getElementById('no-speech-banner');
      if (banner) banner.classList.remove('hidden');
      return;
    }
    this.supported = true;

    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript;
      const isFinal = last.isFinal;
      if (this.onTranscript) this.onTranscript(text, isFinal);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onerror = (e) => {
      this.isListening = false;
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[Voice] Recognition error:', e.error);
      }
    };

    // Pre-load voices
    this._loadVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this._loadVoices();
    }
  },

  _loadVoices() {
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      this._voicesLoaded = true;
    }
  },

  _pickVoice() {
    const voices = this.synthesis.getVoices();
    if (!voices.length) return null;
    // Priority list: prefer natural-sounding English voices
    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (
        v.name.includes('Daniel') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('David') ||
        v.name.includes('James') ||
        v.name.includes('Alex')
      )
    );
    if (preferred) return preferred;
    // Fallback: any English voice
    return voices.find(v => v.lang.startsWith('en-')) ||
           voices.find(v => v.lang.startsWith('en')) ||
           voices[0];
  },

  startListening() {
    if (!this.supported || this.isListening) return;
    // Stop any ongoing speech first
    this.synthesis.cancel();
    this.isSpeaking = false;

    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      // Already started — ignore
    }
  },

  stopListening() {
    if (!this.supported || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e) {
      // ignore
    }
    this.isListening = false;
  },

  speak(text, onEnd) {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }
    this.synthesis.cancel();
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    const voice = this._pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      console.warn('[Voice] TTS error:', e.error);
      if (onEnd) onEnd();
    };

    // Workaround for Chrome bug where long utterances get cut off
    const CHUNK_LIMIT = 200;
    if (text.length > CHUNK_LIMIT) {
      this._speakChunked(text, onEnd);
      return;
    }

    this.synthesis.speak(utterance);
  },

  // Split long text into sentences for Chrome TTS bug workaround
  _speakChunked(text, onEnd) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let index = 0;
    const speakNext = () => {
      if (index >= sentences.length) {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        return;
      }
      const chunk = sentences[index++].trim();
      if (!chunk) { speakNext(); return; }
      const utt = new SpeechSynthesisUtterance(chunk);
      utt.rate = 0.92;
      utt.pitch = 0.95;
      utt.volume = 1;
      const voice = this._pickVoice();
      if (voice) utt.voice = voice;
      utt.onend = speakNext;
      utt.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };
      this.synthesis.speak(utt);
    };
    speakNext();
  },

  stop() {
    this.synthesis.cancel();
    this.stopListening();
    this.isSpeaking = false;
  }
};
