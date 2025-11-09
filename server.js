import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload-Verzeichnis
const upload = multer({ dest: "uploads/" });

// SMTP Transport (Brevo)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Hilfsfunktion: Body formatieren
function formatBody(body) {
  return Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

// ✅ Versand an Betreiber
async function sendMailToOwner(subject, bodyText, file) {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text: bodyText,
    attachments: file
      ? [{ filename: file.originalname, path: file.path }]
      : []
  };
  await transporter.sendMail(mailOptions);
}

// ✅ Bestätigung an Kunden
async function sendMailToCustomer(toAddress) {
  if (!toAddress) return;
  const subject = "Ihre Anfrage bei Palettex.de";
  const text = `Sehr geehrte Damen und Herren,

vielen Dank für Ihre Anfrage. Wir haben diese erhalten und werden sie schnellstmöglich bearbeiten.

Mit freundlichen Grüßen  
Ihr Palettex-Team  
www.palettex.de`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: toAddress,
    subject,
    text
  });
}

// 🟠 Anfrage Palettenhandel
app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text =
    "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Anfrage (Handel)", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("Fehler beim Mailversand (Handel):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// 🟢 Anfrage Freistellung
app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text =
    "Neue Freistellungs-Anfrage (Clearing):\n\n" + formatBody(req.body);
  try {
    await sendMailToOwner("Neue Paletten-Freistellung", text, req.file);
    await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (err) {
    console.error("Fehler beim Mailversand (Clearing):", err);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// Health Check
app.get("/", (_, res) => res.send("Palettex Backend läuft ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
