document.addEventListener("DOMContentLoaded", () => {
  const toUk = document.getElementById("toUk");
  const toEn = document.getElementById("toEn");
  const toJa = document.getElementById("toJa");
  if (!toUk || !toEn) return;

  const path = location.pathname;

  const isUk = path.includes("/uk/");
  const isEn = path.includes("/en/");
  const isJa = path.includes("/ja/");

  function withLang(lang) {
    if (isUk) return path.replace("/uk/", `/${lang}/`);
    if (isEn) return path.replace("/en/", `/${lang}/`);
    if (isJa) return path.replace("/ja/", `/${lang}/`);
    return `/${lang}/index.html`;
  }

  const ukPath = withLang("uk");
  const enPath = withLang("en");
  const jaPath = withLang("ja");

  toUk.href = ukPath + location.search + location.hash;
  toEn.href = enPath + location.search + location.hash;

  if (toJa) toJa.href = jaPath + location.search + location.hash;

  toUk.classList.toggle("active", isUk);
  toEn.classList.toggle("active", isEn);
  if (toJa) toJa.classList.toggle("active", isJa);
});

document.addEventListener("DOMContentLoaded", () => {
  const mq = window.matchMedia("(max-width: 768px)");
  const headerMenu = document.querySelector(".header-menu");
  const footerNav =
    document.querySelector(".footer-nav") || document.querySelector("footer");
  if (!headerMenu || !footerNav) return;

  const rankEls = Array.from(headerMenu.querySelectorAll(".rank-menu"));
  if (rankEls.length === 0) return;

  const originalPos = rankEls.map((el) => ({
    el,
    parent: el.parentNode,
    next: el.nextSibling,
  }));

  function getFooterDock() {
    let dock = document.getElementById("footerRanks");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "footerRanks";
      dock.className = "footer-ranks";
      const p = footerNav.querySelector("p");
      if (p) footerNav.insertBefore(dock, p);
      else footerNav.appendChild(dock);
    }
    return dock;
  }

  function moveToFooter() {
    const dock = getFooterDock();
    rankEls.forEach((el) => dock.appendChild(el));
  }

  function moveBackToHeader() {
    originalPos.forEach(({ el, parent, next }) => {
      parent.insertBefore(el, next);
    });
    const dock = document.getElementById("footerRanks");
    if (dock && dock.children.length === 0) dock.remove();
  }

  function apply() {
    if (mq.matches) moveToFooter();
    else moveBackToHeader();
  }

  apply();
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else mq.addListener(apply);
});
