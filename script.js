
function attachFormHandler(formId, statusId, endpoint) {
  const form = document.getElementById(formId);
  const statusEl = document.getElementById(statusId);
  if (!form || !statusEl) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    statusEl.textContent = "Sende Anfrage...";
    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      let data = {}; try { data = await res.json(); } catch (_) {}
      if (res.ok) { statusEl.textContent = data.message || "Anfrage erfolgreich übermittelt."; form.reset(); }
      else { statusEl.textContent = data.message || "Fehler beim Versand der Anfrage."; }
    } catch (err) { console.error(err); statusEl.textContent = "Netzwerkfehler – bitte später erneut versuchen."; }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  attachFormHandler("formHandel", "statusHandel", "/api/handel");
  attachFormHandler("formClearing", "statusClearing", "/api/clearing");
});
