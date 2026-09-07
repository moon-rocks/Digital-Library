async function isAdminUser(user) {
  if (!user || !isConfigured()) return false;
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("Admin authorization lookup failed:", error);
    return false;
  }
  return !error && Boolean(data);
}
async function requireAuth() {
  const isLogin = location.pathname.endsWith("login.html");
  if (!isConfigured()) {
    if (!isLogin) location.href = "login.html?setup=required";
    return false;
  }
  const { data } = await supabaseClient.auth.getSession();
  const allowed = await isAdminUser(data.session?.user);
  if (!allowed && !isLogin) location.href = "login.html?unauthorized=1";
  if (allowed && isLogin) location.href = "index.html";
  return allowed;
}
async function logout() {
  try {
    if (isConfigured()) await supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    location.href = "login.html";
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  document
    .querySelectorAll("[data-logout]")
    .forEach((button) => button.addEventListener("click", logout));
  await requireAuth();
  const form = document.querySelector("#loginForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = document.querySelector("#loginNotice");
    const button = form.querySelector("button");
    if (!isConfigured() || SUPABASE_ANON_KEY.includes("YOUR_")) {
      notice.textContent = SUPABASE_ANON_KEY.includes("YOUR_")
        ? "Supabase publishable key is missing. Add it to config/supabase.js before signing in."
        : "Supabase is not configured. Check config/supabase.js before signing in.";
      notice.className = "notice error show";
      return;
    }
    button.disabled = true;
    button.textContent = "Signing in...";
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: form.email.value.trim(),
        password: form.password.value,
      });
      if (error) throw error;
      if (!(await isAdminUser(data.user))) {
        await supabaseClient.auth.signOut();
        throw new Error(
          "This account is not authorized for the admin panel. Add its Auth user ID to admin_users with role admin.",
        );
      }
      location.href = "index.html";
    } catch (error) {
      notice.textContent = error.message.includes("authorized")
        ? error.message
        : "Login failed. Check your email, password, and connection.";
      notice.className = "notice error show";
      button.disabled = false;
      button.textContent = "Login to Dashboard";
    }
  });
});
