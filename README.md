# Mon CV augmenté

CV en ligne de Ludovic Dodin, Directeur des Systèmes d'Information, expert cybersécurité et conformité (ISO 27001, RGPD, gouvernance de l'IA). La page intègre un assistant IA permettant aux recruteurs d'interroger le parcours.

L'ensemble (page + assistant) est hébergé gratuitement sur **Vercel**, avec un seul lien public.

## Contenu du dépôt

- `index.html` : la page du CV, avec l'assistant intégré.
- `api/chat.js` : la fonction qui protège la clé Gemini (elle n'est jamais exposée dans la page).
- `favicon.svg`, `logo-mark.svg`, `logo-lockup.svg` : l'identité visuelle.

## Mise en ligne (une seule fois, sans terminal)

1. Envoyer ces fichiers sur GitHub (dépôt `mon-cv-ia`).
2. Aller sur **vercel.com** et se connecter avec le compte GitHub.
3. Cliquer sur **Add New… → Project**, puis importer le dépôt `mon-cv-ia`.
4. Avant de valider, ouvrir la section **Environment Variables** et ajouter :
   - Nom : `GEMINI_API_KEY`
   - Valeur : votre clé Gemini
5. Cliquer sur **Deploy**. Après une minute, Vercel affiche l'adresse publique
   du site, de la forme `https://mon-cv-ia.vercel.app` : c'est le lien à transmettre.

Toute modification poussée ensuite sur GitHub est republiée automatiquement.

## Pourquoi ce fonctionnement

Une clé d'API est un secret. Elle ne doit jamais figurer dans une page publique, dont
le code est lisible par tous. Ici, la page appelle la fonction `api/chat.js` hébergée sur
le même domaine ; cette fonction seule lit la clé, depuis une variable d'environnement
chiffrée saisie dans le tableau de bord Vercel, et interroge Gemini. La clé ne quitte
jamais le serveur.

## Conformité (RGPD)

- L'assistant repose sur l'API Google Gemini, service tiers pouvant impliquer un transfert
  de données hors Union européenne. Un avertissement invite le visiteur à ne pas saisir
  de données personnelles.
- Aucune donnée personnelle sensible (adresse, téléphone, date de naissance) ne figure sur
  la page ni dans le contexte fourni au modèle.
- Aucun historique des échanges n'est conservé.
- Il est recommandé de définir un plafond d'usage sur la clé dans Google AI Studio.

## Personnalisation

- Le texte du CV se modifie directement dans `index.html`.
- Un bouton de contact par courriel est préparé mais désactivé : activez-le avec une adresse
  professionnelle dédiée si vous le souhaitez.
- Aucune photographie n'est intégrée ; son ajout reste un choix personnel.
