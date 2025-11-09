import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Pfade definieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express App
const app = express();

// CORS erlauben (Frontend = Strato)
app.use(cors({
  origin: [
    "https://www.palettex.de",
    "https://palettex.de"
  ],
  methods: ["POST"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Datei-Upload
const upload = multer({ dest: "uploads/" });

// Nodemailer SMTP Transporter für Brevo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,     // smtp-relay.brevo.com
  port: process.env.SMTP_PORT,     // 587
  secure: false,                   // STARTTLS (nicht SSL)
  auth: {
    user: process.env.SMTP_USER,   // z. B. anfrage@palettex.de
    pass: process.env.SMTP_PASS    // dein Brevo-SMTP-Schlüssel
  }
});

// Formatierung der Body-Daten
function formatBody(body) {
  return Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

// Mail an Admin (Palettex)
async function sendMailToOwner(subject, bodyText, file) {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text: bodyText,
    attachments: file ? [{ filename: file.originalname, path: file.path }] : []
  };
  await transporter.sendMail(mailOptions);
}

// Mail an Kunden (Bestätigung)
async function sendMailToCustomer(toAddress) {
  if (!toAddress) return;

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: toAddress,
    subject: "Ihre Anfrage bei Palettex.de",
    text: `Sehr geehrte Damen und Herren,

wir haben Ihre Anfrage erhalten und werden diese schnellstmöglich bearbeiten.
Bei Rückfragen melden wir uns kurzfristig bei Ihnen.

Mit freundlichen Grüßen
Ihr Palettex-Team

—
Palettex.de`
  };

  await transporter.sendMail(mailOptions);
}

// API-Endpunkte
app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text = "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Anfrage (Handel)", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("❌ Fehler beim Mailversand (Handel):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text = "Neue Freistellungs-Anfrage (Clearing):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Freistellung", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("❌ Fehler beim Mailversand (Clearing):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// 🟢 Root-Route — keine index.html mehr nötig!
app.get("/", (req, res) => {
  res.status(200).send("✅ Palettex Backend läuft erfolgreich auf Render (API online).");
});

// Serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Palettex Backend läuft auf Port ${PORT}`));
