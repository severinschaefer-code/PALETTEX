import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import Brevo from "@getbrevo/brevo";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Upload (In-Memory, kein temp-FS) ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Brevo API Konfiguration ---
const brevoApi = new Brevo.TransactionalEmailsApi();
brevoApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// --- Helper ---
function formatBody(body) {
  return Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

async function sendMailToOwner(subject, text, file) {
  const email = new Brevo.SendSmtpEmail();
  email.sender = { name: "Palettex.de", email: process.env.MAIL_FROM };
  email.to = [{ email: process.env.MAIL_TO }];
  email.subject = subject;
  email.textContent = text;

  if (file) {
    email.attachment = [
      {
        name: file.originalname,
        content: file.buffer.toString("base64"),
      },
    ];
  }
  return brevoApi.sendTransacEmail(email);
}

async function sendMailToCustomer(toAddress) {
  if (!toAddress) return;
  const email = new Brevo.SendSmtpEmail();
  email.sender = { name: "Palettex.de", email: process.env.MAIL_FROM };
  email.to = [{ email: toAddress }];
  email.subject = "Ihre Anfrage bei Palettex.de";
  email.textContent = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Anfrage über Palettex.de.
Wir haben Ihre Angaben erhalten und werden diese schnellstmöglich bearbeiten.

Mit freundlichen Grüßen
Ihr Palettex-Team
—
Palettex.de`;

  return brevoApi.sendTransacEmail(email);
}

// --- ROUTEN ---
app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text = "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Anfrage (Handel)", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("❌ Fehler (Handel):", err);
    res.status(500).json({ message: "Fehler beim Mailversand.", error: err.message });
  }
});

app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text = "Neue Freistellungs-Anfrage (Clearing):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Freistellung", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("❌ Fehler (Clearing):", err);
    res.status(500).json({ message: "Fehler beim Mailversand.", error: err.message });
  }
});

app.get("/", (req, res) => res.send("✅ Palettex Backend läuft auf Koyeb."));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 API aktiv auf Port ${PORT}`));
