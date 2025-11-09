
import express from "express";
import multer from "multer";
import cors from "cors";
import nodemailer from "nodemailer";
import Transport from "nodemailer-sendinblue-transport";
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
app.use(express.static(path.join(__dirname, "..")));
const upload = multer({ dest: path.join(__dirname, "..", "uploads") });

const transporter = nodemailer.createTransport(new Transport({ apiKey: process.env.SENDINBLUE_API_KEY }));

function formatBody(body) { return Object.entries(body).map(([k, v]) => `${k}: ${v}`).join("\n"); }

async function sendMailToOwner(subject, bodyText, file) {
  const mailOptions = { from: process.env.MAIL_FROM, to: process.env.MAIL_TO, subject, text: bodyText,
    attachments: file ? [{ filename: file.originalname, path: file.path }] : [] };
  await transporter.sendMail(mailOptions);
}

async function sendMailToCustomer(toAddress) {
  if (!toAddress) return;
  const subject = "Ihre Anfrage bei Palettex.de";
  const text = `Sehr geehrte Damen und Herren,

wir haben Ihre Anfrage erhalten und werden diese schnellstmöglich bearbeiten.
Bei Rückfragen melden wir uns kurzfristig bei Ihnen.

Mit freundlichen Grüßen
Ihr Palettex-Team

—
Palettex.de`;
  await transporter.sendMail({ from: process.env.MAIL_FROM, to: toAddress, subject, text });
}

app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text = "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);
  try { await sendMailToOwner("Neue Paletten-Anfrage (Handel)", text, req.file); await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." }); }
  catch (err) { console.error(err); res.status(500).json({ message: "Fehler beim Mailversand." }); }
});

app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text = "Neue Freistellungs-Anfrage (Clearing):\n\n" + formatBody(req.body);
  try { await sendMailToOwner("Neue Paletten-Freistellung", text, req.file); await sendMailToCustomer(req.body.email);
    res.json({ message: "E-Mail erfolgreich versendet." }); }
  catch (err) { console.error(err); res.status(500).json({ message: "Fehler beim Mailversand." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Palettex Server läuft auf Port ${PORT}`));
