const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function toast(message, type = "ok") {
  let node = $("#toast");
  if (!node) {
    node = document.createElement("div");
    node.id = "toast";
    node.className = "toast";
    document.body.append(node);
  }
  node.textContent = message;
  node.dataset.type = type;
  node.classList.add("show");
  clearTimeout(node.hideTimer);
  node.hideTimer = setTimeout(() => node.classList.remove("show"), 2800);
}
function menu() {
  const button = $("#menuBtn"),
    sidebar = $(".sidebar");
  if (button && sidebar)
    button.addEventListener("click", () => sidebar.classList.toggle("open"));
}
function theme() {
  const saved = localStorage.getItem("admin-theme");
  if (saved === "dark") document.documentElement.classList.add("dark");
  const button = $("#themeBtn");
  if (button)
    button.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem(
        "admin-theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    });
}
function loadAdminModule(name) {
  const script = document.createElement("script");
  script.src = `js/${name}.js`;
  document.head.append(script);
}
document.addEventListener("DOMContentLoaded", () => {
  menu();
  theme();
  document.querySelectorAll(".demo-pill").forEach((pill) => pill.remove());
  const page = location.pathname.split("/").pop();
  if (page === "announcements.html") loadAdminModule("announcements");
  if (page === "website.html") loadAdminModule("website");
  if (page === "settings.html") loadAdminModule("settings");
  if (page === "media.html") loadAdminModule("media");
});
