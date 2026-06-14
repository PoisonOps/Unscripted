// ─── Supabase Client ─────────────────────────────────────────────────────────
let sbClient = null;

function getClient() {
  if (!sbClient) {
    sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return sbClient;
}

// ─── Session Storage ─────────────────────────────────────────────────────────
const DB = {

  // Save a completed interview session to Supabase
  async saveSession(data) {
    try {
      const client = getClient();
      const { data: { user } } = await client.auth.getUser();
      const { data: row, error } = await client.from('sessions').insert({
        user_id:         user?.id || null,
        temp_session_id: data.tempId,
        category:        data.category,
        company:         data.company || null,
        role:            data.role || null,
        round_type:      data.roundType,
        personality:     data.personality,
        interview_mode:  data.mode,
        transcript:      data.transcript,
        scores:          data.scores || null,
        duration_seconds: data.duration,
        question_count:  data.questionCount,
        context_summary: data.contextSummary || null,
      }).select().single();
      if (error) throw error;
      return row;
    } catch (e) {
      log('saveSession error', e);
      return null;
    }
  },

  // Link anonymous session to user after signup
  async linkSession(tempId, userId) {
    try {
      const client = getClient();
      await client.from('sessions')
        .update({ user_id: userId })
        .eq('temp_session_id', tempId)
        .is('user_id', null);
    } catch (e) {
      log('linkSession error', e);
    }
  },

  // Get session by ID
  async getSession(sessionId) {
    try {
      const client = getClient();
      const { data, error } = await client.from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      log('getSession error', e);
      return null;
    }
  },

  // Get all sessions for current user
  async getUserSessions() {
    try {
      const client = getClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return [];
      const { data, error } = await client.from('sessions')
        .select('id, category, company, role, round_type, scores, duration_seconds, question_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (e) {
      log('getUserSessions error', e);
      return [];
    }
  },

  // Save feedback for a session
  async saveFeedback(sessionId, feedback) {
    try {
      const client = getClient();
      await client.from('feedback').insert({
        session_id:   sessionId,
        overall:      feedback.overall,
        relevance:    feedback.relevance,
        followup:     feedback.followup,
        difficulty:   feedback.difficulty,
        free_text:    feedback.freeText || null,
      });
    } catch (e) {
      log('saveFeedback error', e);
    }
  },

  // Save scores back to session after AI scoring
  async saveScores(sessionId, scores) {
    try {
      const client = getClient();
      await client.from('sessions').update({ scores }).eq('id', sessionId);
    } catch (e) {
      log('saveScores error', e);
    }
  },

  // Analytics
  async logEvent(event, metadata = {}) {
    if (!FLAGS.ENABLE_ANALYTICS) return;
    try {
      const client = getClient();
      const { data: { user } } = await client.auth.getUser();
      await client.from('events').insert({
        event,
        user_id:  user?.id || null,
        metadata,
      });
    } catch (e) {
      // fire and forget
    }
  },
};
