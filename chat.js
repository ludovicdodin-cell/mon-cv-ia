// Fonction serverless hébergée par Vercel.
// La clé Gemini n'est JAMAIS dans la page : elle est lue ici, côté serveur,
// depuis la variable d'environnement GEMINI_API_KEY (saisie dans le tableau de bord Vercel).

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
Tu es l'assistant conversationnel du CV augmenté de Ludovic Dodin,
Directeur des Systèmes d'Information, expert en cybersécurité et conformité.

Informations disponibles :
- Rôle : Directeur des Systèmes d'Information, membre du Comité de direction depuis 5 ans.
- Parcours : plus de 20 ans dans la même organisation, de responsable informatique à DSI.
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

Règles de comportement :
- Réponds en français, sur un ton professionnel et concis.
- Ne réponds qu'à partir des informations ci-dessus. Si une information n'est pas connue,
  indique-le et invite à prendre contact via LinkedIn.
- Ne demande, ne collecte et ne stocke aucune donnée personnelle du visiteur.
- Ne communique jamais de coordonnées privées (téléphone, adresse, courriel personnel).
`.trim();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
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

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!upstream.ok) {
      return res.status(502).json({ error: "Service momentanément indisponible." });
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
    return res.status(502).json({ error: "Service momentanément indisponible." });
  }
}
