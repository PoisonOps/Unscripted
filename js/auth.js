// ─── Auth Module ─────────────────────────────────────────────────────────────
const Auth = {

  async getUser() {
    const client = getClient();
    const { data: { user } } = await client.auth.getUser();
    return user;
  },

  async signupWithEmail(email, password, name) {
    const client = getClient();
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    return data.user;
  },

  async loginWithEmail(email, password) {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async loginWithGoogle() {
    const client = getClient();
    // Save current page so we can return after OAuth redirect
    sessionStorage.setItem('us_post_auth_url', window.location.href);
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: APP_URL }
    });
    if (error) throw error;
  },

  async logout() {
    const client = getClient();
    await client.auth.signOut();
    window.location.href = '/';
  },

  async onAuthChange(callback) {
    const client = getClient();
    client.auth.onAuthStateChange(async (event, session) => {
      callback(event, session?.user || null);
    });
  },

  // After signup, link any pending anonymous session to this user
  async handlePostSignup(user) {
    const tempId = sessionStorage.getItem('us_temp_session_id');
    if (tempId) {
      await DB.linkSession(tempId, user.id);
      sessionStorage.removeItem('us_temp_session_id');
    }
  },
};
