(function(){
    const form = document.getElementById("contactForm");
    const btn = document.getElementById("contactSubmit");
    const status = document.getElementById("contactStatus");

    const setError = (name, message) => {
      const el = form.querySelector(`[data-error-for="${name}"]`);
      if (el) el.textContent = message || "";
    };

    const clearErrors = () => {
      ["name","email","subject","message"].forEach(n => setError(n, ""));
    };

    const validate = () => {
      clearErrors();
      let ok = true;

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const subject = form.elements.subject.value.trim();
      const message = form.elements.message.value.trim();
      const consent = form.elements.consent.checked;

      if (name.length < 2){ setError("name", "Вкажи ім’я (мін. 2 символи)."); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setError("email", "Вкажи коректний email."); ok = false; }
      if (subject.length < 3){ setError("subject", "Тема має бути довшою (мін. 3 символи)."); ok = false; }
      if (message.length < 10){ setError("message", "Повідомлення має бути довшим (мін. 10 символів)."); ok = false; }
      if (!consent){ status.textContent = "Потрібна згода на обробку даних."; ok = false; }

      return ok;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = "";

      if (!validate()) return;

      btn.disabled = true;
      btn.classList.add("is-loading");
      status.textContent = "Відправляю…";

      try{
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: new FormData(form),
        });

        if (res.ok){
          form.reset();
          clearErrors();
          status.textContent = "✅ Повідомлення надіслано! Дякую!";
        } else {
          status.textContent = "❌ Не вдалося надіслати. Спробуй ще раз.";
        }
      } catch (err){
        status.textContent = "❌ Помилка мережі. Перевір інтернет і повтори.";
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-loading");
      }
    });
  })();