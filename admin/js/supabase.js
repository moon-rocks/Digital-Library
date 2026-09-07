const config = window.DIGITAL_LIBRARY_CONFIG || {};
const SUPABASE_URL = config.url || "";
const SUPABASE_ANON_KEY = config.anonKey || "";
const isConfigured = () =>
  Boolean(
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("YOUR_") &&
    !SUPABASE_ANON_KEY.includes("placeholder"),
  );
const supabaseClient = isConfigured()
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
const RESOURCE_TYPES = [
  "Book",
  "Notes",
  "PYQ",
  "Lab Manual",
  "Syllabus",
  "Cheatsheet",
  "Beyond Curriculum",
  "Publication",
  "Newsletter",
  "Magazine",
];
const isDemoSession = () => false;
function getDemoResources() {
  return [];
}
function setDemoResources() {
  return undefined;
}
