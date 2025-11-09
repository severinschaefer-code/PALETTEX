document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const endpoint = form.getAttribute("action");
      try {
        const response = await fetch(endpoint, { method: "POST", body: formData });
        let data = {};
        try { data = await response.json(); } catch (e) {}
        if (response.ok) {
          showMessage(data.message || "✅ Ihre Anfrage wurde erfolgreich versendet.", "success");
          form.reset();
        } else {
          showMessage(data.message || "❌ Fehler beim Senden der Anfrage.", "error");
        }
      } catch (error) {
        console.error("Fehler:", error);
        showMessage("⚠️ Netzwerkfehler. Bitte versuchen Sie es erneut.", "error");
      }
    });
  });
});

function showMessage(text, type) {
  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.position = "fixed";
  msg.style.bottom = "24px";
  msg.style.right = "24px";
  msg.style.padding = "12px 18px";
  msg.style.borderRadius = "10px";
  msg.style.fontSize = "15px";
  msg.style.zIndex = "9999";
  msg.style.boxShadow = "0 10px 25px rgba(0,0,0,0.4)";
  msg.style.transition = "opacity 0.4s ease, transform 0.4s ease";
  msg.style.display = "flex";
  msg.style.alignItems = "center";
  msg.style.gap = "8px";
  msg.style.transform = "translateY(8px)";
  msg.style.opacity = "0";

  if (type === "success") {
    msg.style.background = "linear-gradient(to right, #22c55e, #16a34a)";
    msg.style.color = "#ecfdf5";
  } else {
    msg.style.background = "linear-gradient(to right, #f97316, #b91c1c)";
    msg.style.color = "#fef2f2";
  }

  document.body.appendChild(msg);
  requestAnimationFrame(() => {
    msg.style.transform = "translateY(0)";
    msg.style.opacity = "1";
  });
  setTimeout(() => {
    msg.style.opacity = "0";
    msg.style.transform = "translateY(8px)";
    setTimeout(() => msg.remove(), 400);
  }, 4000);
}
