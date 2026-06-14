// ─── Environment ────────────────────────────────────────────────────────────
const IS_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// ─── Supabase ────────────────────────────────────────────────────────────────
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://ubjdjqazojnbmvuavhwz.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViamRqcWF6b2puYm12dWF2aHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTUyMDAsImV4cCI6MjA5NzAzMTIwMH0.Nk8smSpiD-838OEiAopLGkbwcSNGLQeWBT_CdpYAuvA';

// ─── Feature Flags ───────────────────────────────────────────────────────────
const FLAGS = {
  DEBUG_LOG:        IS_DEV,
  ENABLE_ANALYTICS: true,
  ENABLE_DASHBOARD: true,
};

// ─── App Constants ───────────────────────────────────────────────────────────
const APP_NAME    = 'Unscripted';
const APP_URL     = IS_DEV ? 'http://localhost:3000' : 'https://unscripted-interview.vercel.app';
const WA_NUMBER   = '917080442040';

function log(...args) {
  if (FLAGS.DEBUG_LOG) console.log('[Unscripted]', ...args);
}
