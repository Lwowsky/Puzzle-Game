document.addEventListener("DOMContentLoaded", () => {
  const toUk = document.getElementById("toUk");
  const toEn = document.getElementById("toEn");
  if (!toUk || !toEn) return;

  const path = location.pathname;
  const isUk = path.includes("/uk/");
  const isEn = path.includes("/en/");

  // якщо ти на /uk/ — шлях для англ робимо replace на /en/
  // якщо ти на /en/ — шлях для укр робимо replace на /uk/
  // якщо ніде — ведемо на uk/index.html та en/index.html
  const ukPath = isEn ? path.replace("/en/", "/uk/") : (isUk ? path : "/uk/index.html");
  const enPath = isUk ? path.replace("/uk/", "/en/") : (isEn ? path : "/en/index.html");

  toUk.href = ukPath + location.search + location.hash;
  toEn.href = enPath + location.search + location.hash;

  // підсвітити активний прапор (без CSS теж буде видно через class)
  toUk.classList.toggle("active", isUk);
  toEn.classList.toggle("active", isEn);
});
