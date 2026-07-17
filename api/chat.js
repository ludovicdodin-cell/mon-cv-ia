// Fonction serverless Vercel (format CommonJS, compatible sans configuration).
// La clé Gemini n'est JAMAIS dans la page : elle est lue ici, côté serveur,
// depuis la variable d'environnement GEMINI_API_KEY (tableau de bord Vercel).

// Alias « flash-latest » : pointe toujours vers le modèle Flash courant,
// ce qui évite les erreurs 404 lors des futures mises à jour de Google.
const GEMINI_MODEL = "gemini-flash-latest";

const SYSTEM_PROMPT = `
Tu es l'assistant conversationnel du CV augmenté de Ludovic Dodin,
Directeur des Systèmes d'Information, expert en cybersécurité et conformité.

Informations disponibles :
- Situation : Marié - 3 enfants.
- Disponibilité : En poste actuellement - Préavis de 3 mois.
- Rôle : Directeur des Systèmes d'Information, membre du Comité de direction depuis 5 ans.
- Parcours : plus de 20 ans dans la même organisation, de responsable informatique, responsable qualité à DSI.
- Réussite : J’ai débuté ma carrière en tant qu’employé de bureau dans une entreprise de travail temporaire.
 J’ai ensuite rejoint une entreprise du secteur du bâtiment, où j’ai occupé un poste similaire.
Souhaitant relever de nouveaux défis, j’ai intégré une société de téléphonie en tant qu’aide-comptable. 
Passionné par l’informatique depuis mon plus jeune âge, j’ai décidé de quitter cette organisation afin de reprendre mes études universitaires dans le but d’orienter ma carrière vers les métiers de l’informatique.
À l’issue de cette reconversion, j’ai commencé mon parcours dans le secteur informatique en exerçant des activités de développement en tant qu’indépendant, avant de rejoindre un intégrateur SAP. 
Cette expérience m’a permis de renforcer mes compétences techniques.
J’ai ensuite intégré mon entreprise actuelle en qualité de Responsable Informatique.
- Gouvernance, risques et cybersécurité : Responsable du SMSI ISO 27001 depuis 2018,
  pilotage de l'analyse de risques et de la conformité, audits de certification,
  défense du SI lors des due diligences clients, fonction de DPO / RGPD.
- IA : intégration de Claude AI au développement (revue de code, remédiation de failles,
  optimisation, environ 70 % de gains), cadrage de la gouvernance de l'IA.
- Infrastructure : hyperconvergé, réseaux, téléphonie omnicanale (VOIP, SIP, SVI, CTI),
  sauvegarde et PRA, migration M365, MFA, dématérialisation NF 544, LAD/RAD/OCR, RPA.
- Compétences : ISO 27001, RGPD/DPO, PCI-DSS, Ethical Hacking, analyse de risques,
  NF Z42-013/026, archivage électronique, Kiamo.
- Formations : Prompt Engineering (2026), NF 544 (2019), NF Z42 (2018), GDPR (2017),
  Ethical Hacking (2016), ISO 27001/PCI-DSS (2015), DEUST BC2E (1999).
- Engagements : CLUSIR Nord de France, La Cité de l'IA, eFutura, association Toi Demain.
- Objectif : nouveau projet en cybersécurité, conformité, management de transition, gouvernance.
- Loisirs : Peinture, Sculture, Photographie, Musique.
- Diplômes : CAP mécanique auto, CAP Employée de Bureau,  BEP Administration commercial et comptable, BAC PRO En comptabilité et Bureautique, DEUST BC2E (1999) 

Règles de comportement :
- Réponds en français, sur un ton professionnel et concis.
- Ne réponds qu'à partir des informations ci-dessus. Si une information n'est pas connue,
  indique-le et invite à prendre contact via LinkedIn.
- Ne demande, ne collecte et ne stocke aucune donnée personnelle du visiteur.
- Ne communique jamais de coordonnées privées (téléphone, adresse, courriel personnel).
`.trim();

module.exports = async function handler(req, res) {
  // Vérification de santé : ouvrir l'adresse /api/chat dans un navigateur.
  // Indique si la fonction est déployée et si la clé est bien configurée
  // (sans jamais révéler la clé elle-même).
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      modele: GEMINI_MODEL,
      cleConfiguree: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "L'assistant n'est pas encore configuré.",
      });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

    const contents = messages
      .filter((m) => m && typeof m.content === "string")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, 2000) }],
      }));

    if (contents.length === 0) {
      return res.status(400).json({ error: "Aucun message." });
    }

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    };

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    };

    // Reprise automatique en cas de pic de demande (HTTP 503) : jusqu'à 3 essais.
    let upstream;
    for (let essai = 1; essai <= 3; essai++) {
      upstream = await fetch(endpoint, options);
      if (upstream.status !== 503) break;
      if (essai < 3) await new Promise((r) => setTimeout(r, 800 * essai));
    }

    if (!upstream.ok) {
      console.error("Erreur Gemini", upstream.status);
      return res.status(502).json({
        error: "L'assistant est momentanément indisponible. Merci de réessayer dans un instant.",
      });
    }

    const data = await upstream.json();
    const reply =
      (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("")
        .trim() || "Je ne dispose pas de cette information.";

    // Aucune journalisation du contenu échangé (minimisation RGPD).
    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Exception fonction", e);
    return res.status(502).json({
      error: "L'assistant est momentanément indisponible. Merci de réessayer dans un instant.",
    });
  }
};
