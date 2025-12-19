document.addEventListener("DOMContentLoaded", () => {
  const toUk = document.getElementById("toUk");
  const toEn = document.getElementById("toEn");
  if (!toUk || !toEn) return;

  const path = location.pathname;
  const isUk = path.includes("/uk/");
  const isEn = path.includes("/en/");

  const ukPath = isEn ? path.replace("/en/", "/uk/") : (isUk ? path : "/uk/index.html");
  const enPath = isUk ? path.replace("/uk/", "/en/") : (isEn ? path : "/en/index.html");

  toUk.href = ukPath + location.search + location.hash;
  toEn.href = enPath + location.search + location.hash;

  toUk.classList.toggle("active", isUk);
  toEn.classList.toggle("active", isEn);
});

document.addEventListener("DOMContentLoaded", () => {
  const mq = window.matchMedia("(max-width: 768px)");

  const headerMenu = document.querySelector(".header-menu");
  const footerNav = document.querySelector(".footer-nav") || document.querySelector("footer");
  if (!headerMenu || !footerNav) return;

  // ✅ зберігаємо 6 елементів один раз (поки вони ще в хедері)
  const rankEls = Array.from(headerMenu.querySelectorAll(".rank-menu"));
  if (rankEls.length === 0) return;

  // ✅ запам’ятовуємо їхні початкові позиції (щоб повернути точно назад)
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

  // ✅ реагує на зміну ширини (моб ⇄ пк)
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else mq.addListener(apply); // старі браузери
});
