(() => {
  const a = document.getElementById("langSwitch");
  if (!a) return;

  const path = location.pathname; // /Puzzle-Game/uk/rank001.html
  const isUk = path.includes("/uk/");
  const target = isUk ? path.replace("/uk/", "/en/") : path.replace("/en/", "/uk/");

  a.href = target + location.search + location.hash;
  a.textContent = isUk ? "EN" : "UK";
})();
