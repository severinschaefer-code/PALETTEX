// script.js
document.addEventListener("DOMContentLoaded", () => {
  const handelForm = document.getElementById("handelForm");
  const clearingForm = document.getElementById("clearingForm");

  async function sendForm(form, endpoint) {
    const formData = new FormData(form);
    const messageBox = document.createElement("div");
    messageBox.style.position = "fixed";
    messageBox.style.bottom = "20px";
    messageBox.style.right = "20px";
    messageBox.style.padding = "10px 20px";
    messageBox.style.borderRadius = "8px";
    messageBox.style.color = "#fff";
    messageBox.style.fontWeight = "500";
    messageBox.style.zIndex = "9999";

    try {
      const response = await fetch(`https://paletex.onrender.com${endpoint}`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Fehler beim Mailversand.");

      messageBox.textContent = "✅ Anfrage erfolgreich gesendet!";
      messageBox.style.background = "linear-gradient(90deg,#28a745,#218838)";
      document.body.appendChild(messageBox);
      setTimeout(() => messageBox.remove(), 4000);
      form.reset();

    } catch (error) {
      console.error(error);
      messageBox.textContent = "❌ Fehler beim Mailversand.";
      messageBox.style.background = "linear-gradient(90deg,#dc3545,#b02a37)";
      document.body.appendChild(messageBox);
      setTimeout(() => messageBox.remove(), 4000);
    }
  }

  if (handelForm) {
    handelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendForm(handelForm, "/api/handel");
    });
  }

  if (clearingForm) {
    clearingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendForm(clearingForm, "/api/clearing");
    });
  }
});
