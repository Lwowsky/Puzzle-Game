document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("langSwitch");
  if (!btn) return;

  const url = new URL(location.href);
  const path = url.pathname;

  const isUk = /\/uk(\/|$)/.test(path);
  const isEn = /\/en(\/|$)/.test(path);

  let newPath = path;

  if (isUk) newPath = path.replace(/\/uk(\/|$)/, "/en$1");
  else if (isEn) newPath = path.replace(/\/en(\/|$)/, "/uk$1");
  else {
    newPath = "/Puzzle-Game/uk/index.html";
  }

  url.pathname = newPath;

  btn.href = url.toString();
  btn.textContent = isUk ? "EN" : "UK";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.setItem("lang", isUk ? "en" : "uk");
    location.assign(btn.href);
  });
});
