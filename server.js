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

const upload = multer({ dest: "uploads/" });

// 📬 Brevo Konfiguration
const defaultClient = Brevo.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

// 📄 Body formatieren
function formatBody(body) {
  return Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

// 🟠 Anfrage – Palettenhandel
app.post("/api/handel", upload.single("upload"), async (req, res) => {
  const text =
    "Neue Paletten-Anfrage (Verkauf / Kauf):\n\n" + formatBody(req.body);

  try {
    // Mail an Betreiber
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM, name: "Palettex.de" },
      to: [{ email: process.env.MAIL_TO }],
      subject: "Neue Paletten-Anfrage (Handel)",
      textContent: text,
    });

    // Bestätigung an Kunde
    if (req.body.email) {
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.MAIL_FROM, name: "Palettex.de" },
        to: [{ email: req.body.email }],
        subject: "Ihre Anfrage bei Palettex.de",
        textContent:
          "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage. Wir haben diese erhalten und werden sie schnellstmöglich bearbeiten.\n\nMit freundlichen Grüßen\nIhr Palettex-Team\nwww.palettex.de",
      });
    }

    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (error) {
    console.error("❌ Fehler beim Mailversand (Handel):", error);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// 🟢 Anfrage – Freistellung / Clearing
app.post("/api/clearing", upload.single("upload"), async (req, res) => {
  const text =
    "Neue Freistellungs-Anfrage (Clearing):\n\n" + formatBody(req.body);

  try {
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.MAIL_FROM, name: "Palettex.de" },
      to: [{ email: process.env.MAIL_TO }],
      subject: "Neue Paletten-Freistellung",
      textContent: text,
    });

    if (req.body.email) {
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.MAIL_FROM, name: "Palettex.de" },
        to: [{ email: req.body.email }],
        subject: "Ihre Freistellungsanfrage bei Palettex.de",
        textContent:
          "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Freistellungsanfrage. Wir werden diese prüfen und uns zeitnah bei Ihnen melden.\n\nMit freundlichen Grüßen\nIhr Palettex-Team\nwww.palettex.de",
      });
    }

    res.json({ message: "E-Mail erfolgreich versendet." });
  } catch (error) {
    console.error("❌ Fehler beim Mailversand (Clearing):", error);
    res.status(500).json({ message: "Fehler beim Mailversand." });
  }
});

// Health Check
app.get("/", (_, res) => res.send("✅ Palettex Backend (Brevo API) läuft!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server gestartet auf Port ${PORT}`)
);
