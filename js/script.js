//Burger Menu
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("burgerBtn");
  const nav = document.getElementById("primaryNav");
  const overlay = document.getElementById("navOverlay");
  if (!btn || !nav || !overlay) return;
  const icon = btn.querySelector("i");
  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    nav.setAttribute("aria-hidden", String(!open));
    overlay.hidden = !open;
    if (icon) icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  overlay.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
});
