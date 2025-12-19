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
