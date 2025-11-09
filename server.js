import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (serve index.html, css, js)
app.use(express.static(__dirname));

// File upload setup
const upload = multer({ dest: path.join(__dirname, "uploads") });

// 🔧 SMTP Transport über Brevo
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS wird automatisch aktiviert
  auth: {
    user: process.env.SMTP_USER, // z. B. 9b2481001@smtp-brevo.com
    pass: process.env.SMTP_PASS, // dein Brevo-SMTP-Schlüssel
  },
});

// Formatierung des E-Mail-Inhalts
function formatBody(body) {
  return Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

// Mail an dich (Admin)
async function sendMailToOwner(subject, bodyText, file) {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text: bodyText,
    attachments: file ? [{ filename: file.originalname, path: file.path }] : [],
  };
  await transporter.sendMail(mailOptions);
}

// Mail an Kunden (Bestätigung)
async function sendMailToCustomer(toAddress) {
  if (!toAddress) return;
  const subject = "Ihre Anfrage bei Palettex.de";
  const text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Anfrage über Palettex.de.
Wir haben Ihre Angaben erhalten und werden diese schnellstmöglich bearbeiten.

Mit freundlichen Grüßen
Ihr Palettex-Team

—
Palettex.de`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toAddress,
    subject,
    text,
  });
}

// 📦 Route 1: Palettenhandel
app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text = "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Anfrage", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("Fehler beim Mailversand (Handel):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// 📦 Route 2: Freistellung (Clearing)
app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text = "Neue Freistellungs-Anfrage:\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Freistellung", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("Fehler beim Mailversand (Clearing):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// Root Route (index.html bereitstellen)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Palettex Server läuft auf Port ${PORT}`));
