import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // API Route for sending confirmation email
  app.post("/api/send-confirmation", async (req, res) => {
    const { clientEmail, commandeId, produit, prix, customerName, customerLocation, accessToken } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ error: "Email client manquant." });
    }

    // NEW: Handle Gmail API if accessToken is provided
    if (accessToken) {
      try {
        const subject = `Confirmation de votre commande ${commandeId} - ID'AFRO`;
        const body = `Bonjour ${customerName},\n\nNous avons le plaisir de vous informer que votre commande (${produit}) a été confirmée avec succès.\n\nMontant total: ${prix.toLocaleString("fr-FR")} FCFA\n\nNous préparons actuellement votre colis pour la livraison à ${customerLocation || 'votre adresse'}.\n\nMerci de votre confiance !\nL'équipe ID'AFRO`;

        // Gmail API requires the message to be base64url encoded
        const str = [
          `To: ${clientEmail}\n`,
          `Subject: ${subject}\n`,
          'Content-Type: text/plain; charset="UTF-8"\n',
          'MIME-Version: 1.0\n',
          'Content-Transfer-Encoding: 7bit\n\n',
          body
        ].join('');

        const encodedMail = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedMail })
        });

        if (!response.ok) {
          const errorData: any = await response.json();
          throw new Error(errorData.error?.message || "Gmail API error");
        }

        console.log(`Email envoyé via Gmail API à ${clientEmail} pour la commande ${commandeId}`);
        return res.json({ success: true, message: "Email envoyé avec succès via Gmail." });
      } catch (error: any) {
        console.error("Erreur Gmail API:", error);
        return res.status(500).json({ error: `Erreur Gmail: ${error.message}` });
      }
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Configuration email manquante (EMAIL_USER/EMAIL_PASS)");
      return res.status(500).json({ error: "Configuration email manquante dans les variables d'environnement. Veuillez vous connecter avec Google." });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `ID'AFRO <${process.env.EMAIL_USER}>`,
        to: clientEmail,
        subject: `Confirmation de votre commande ${commandeId} - ID'AFRO`,
        text: `Bonjour ${customerName},\n\nNous avons le plaisir de vous informer que votre commande (${produit}) a été confirmée avec succès.\n\nMontant total: ${prix.toLocaleString("fr-FR")} FCFA\n\nNous préparons actuellement votre colis pour la livraison à ${customerLocation || 'votre adresse'}.\n\nMerci de votre confiance !\nL'équipe ID'AFRO`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${clientEmail} pour la commande ${commandeId}`);
      res.json({ success: true, message: "Email envoyé avec succès." });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      res.status(500).json({ error: "L'envoi de l'email a échoué. Vérifiez vos identifiants SMTP dans les paramètres." });
    }
  });

  // Decide whether to use Vite or Static based on environment
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), 'dist');

  if (!isProd) {
    console.log("MODE: Serveur de prévisualisation (Vite)");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Erreur lors de l'initialisation de Vite:", e);
      // Fallback relative to cwd if Vite fails
      app.use(express.static(process.cwd()));
    }
  } else {
    // Production settings
    console.log(`MODE: Production (Statique) - Serving from ${distPath}`);
    
    // Check if dist exists for logging
    if (!fs.existsSync(distPath)) {
      console.error(`DANGER: Dossier 'dist' introuvable à ${distPath}`);
    } else {
      console.log(`Contenu de 'dist': ${fs.readdirSync(distPath).join(', ')}`);
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        // Fallback to searching for index.html in the root or current dir if dist is missing
        const fallbackPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(fallbackPath)) {
           res.sendFile(fallbackPath);
        } else {
           res.status(404).send("Page introuvable : L'application n'est pas encore compilée. Veuillez lancer le build.");
        }
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
