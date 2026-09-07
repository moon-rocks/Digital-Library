const menuBtn = document.querySelector("#menu");
const sideMenu = document.querySelector("#sideMenu");
const closeBtn = document.querySelector("#closeMenu");

if (!menuBtn || !sideMenu || !closeBtn) {
  throw new Error("Navigation menu markup is incomplete.");
}

const sideNavList = sideMenu.querySelector(".side-nav ul");
if (sideNavList && !sideNavList.querySelector('a[href="admin/login.html"]')) {
  const adminItem = document.createElement("li");
  adminItem.className = "admin-nav-item";
  adminItem.innerHTML =
    '<a href="admin/login.html"><i class="fa-solid fa-lock" aria-hidden="true"></i> ADMIN LOGIN</a>';
  sideNavList.append(adminItem);
}

const menuLinks = sideMenu.querySelectorAll(".side-nav a");

const backdrop = document.createElement("div");
backdrop.className = "side-menu-backdrop";
backdrop.setAttribute("aria-hidden", "true");
sideMenu.before(backdrop);

const setMenuState = (isOpen) => {
  sideMenu.classList.toggle("active", isOpen);
  backdrop.classList.toggle("active", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
  menuBtn.setAttribute("aria-expanded", String(isOpen));
  sideMenu.setAttribute("aria-hidden", String(!isOpen));
};

const currentPage =
  window.location.pathname.split("/").pop().toLowerCase() || "index.html";
menuLinks.forEach((link) => {
  const linkPage = link.getAttribute("href")?.split("/").pop().toLowerCase();
  if (linkPage === currentPage) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
  link.addEventListener("click", () => setMenuState(false));
});

menuBtn.addEventListener("click", () => {
  setMenuState(true);
  closeBtn.focus();
});

closeBtn.addEventListener("click", () => {
  setMenuState(false);
  menuBtn.focus();
});

backdrop.addEventListener("click", () => {
  setMenuState(false);
  menuBtn.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sideMenu.classList.contains("active")) {
    setMenuState(false);
    menuBtn.focus();
  }
});

setMenuState(false);
