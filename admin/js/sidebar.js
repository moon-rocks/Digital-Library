(() => {
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  if (!sidebar || !main) return;

  const button =
    document.querySelector("#menuBtn") || document.createElement("button");
  button.type = "button";
  button.className = "mobile-menu";
  button.id = button.id || "adminMenuButton";
  button.setAttribute("aria-label", "Open admin menu");
  button.setAttribute("aria-expanded", "false");
  if (!button.textContent.trim()) button.textContent = "☰";
  if (!button.parentElement) main.prepend(button);

  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "sidebar-overlay";
  overlay.setAttribute("aria-label", "Close admin menu");
  document.body.append(overlay);

  const setOpen = (open) => {
    sidebar.classList.toggle("open", open);
    overlay.classList.toggle("visible", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute(
      "aria-label",
      open ? "Close admin menu" : "Open admin menu",
    );
    document.body.classList.toggle("menu-open", open);
  };

  button.addEventListener("click", () =>
    setOpen(!sidebar.classList.contains("open")),
  );
  overlay.addEventListener("click", () => setOpen(false));
  sidebar
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setOpen(false);
  });
})();
