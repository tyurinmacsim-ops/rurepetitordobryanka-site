const form = document.getElementById("lead-form");
const statusNode = document.getElementById("form-status");

function buildPayload(fd) {
  return {
    name: fd.get("name")?.toString().trim(),
    contact: fd.get("contact")?.toString().trim(),
    grade: fd.get("grade")?.toString().trim(),
    goal: fd.get("goal")?.toString().trim(),
    message: fd.get("message")?.toString().trim() || ""
  };
}

function validate(payload) {
  if (!payload.name || !payload.contact || !payload.grade || !payload.goal) {
    return "Пожалуйста, заполните имя, контакт, класс и цель занятий.";
  }
  return "";
}

function saveDraft(payload) {
  localStorage.setItem("leadDraft", JSON.stringify(payload));
}

function loadDraft() {
  try {
    const raw = localStorage.getItem("leadDraft");
    if (!raw) return;
    const data = JSON.parse(raw);
    for (const [key, value] of Object.entries(data)) {
      const field = form.elements.namedItem(key);
      if (field && typeof value === "string") field.value = value;
    }
  } catch {}
}

if (form) {
  loadDraft();

  form.addEventListener("input", () => {
    const fd = new FormData(form);
    saveDraft(buildPayload(fd));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = buildPayload(fd);
    const error = validate(payload);

    if (error) {
      statusNode.textContent = error;
      statusNode.style.color = "#b42318";
      return;
    }

    statusNode.textContent = "Пробую отправить заявку...";
    statusNode.style.color = "#155eef";

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Сервер пока не подключён");
      }

      statusNode.textContent = "Заявка отправлена. Спасибо! Скоро с вами свяжутся.";
      statusNode.style.color = "#067647";
      localStorage.removeItem("leadDraft");
      form.reset();
    } catch {
      const text = [
        "Заявка пока не подключена к серверной обработке.",
        "Скопируйте текст заявки и отправьте его во ВКонтакте:",
        `Имя: ${payload.name}`,
        `Контакт: ${payload.contact}`,
        `Класс: ${payload.grade}`,
        `Цель: ${payload.goal}`,
        payload.message ? `Комментарий: ${payload.message}` : ""
      ].filter(Boolean).join("\n");

      navigator.clipboard?.writeText(text).catch(() => {});
      statusNode.innerHTML = 'Текст заявки скопирован в буфер. Пожалуйста, отправьте его во <a href="https://vk.com/id90968707" target="_blank" rel="noopener noreferrer">ВКонтакте</a>.';
      statusNode.style.color = "#155eef";
    }
  });
}
