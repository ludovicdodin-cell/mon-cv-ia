# Mon CV augmenté

Site personnel présentant le parcours de Ludovic Dodin, Directeur des Systèmes d'Information, expert en cybersécurité et conformité (SMSI ISO 27001, RGPD, gouvernance de l'IA).

Le site est un fichier unique (`index.html`), sans dépendance à installer, conçu pour être publié gratuitement via **GitHub Pages**.

## Mise en ligne via GitHub Pages

1. Déposer le fichier `index.html` à la racine du dépôt `mon-cv-ia` (bouton **Add file → Upload files**, ou via `git`).
2. Ouvrir l'onglet **Settings** du dépôt, puis la rubrique **Pages**.
3. Dans **Build and deployment → Source**, sélectionner **Deploy from a branch**.
4. Choisir la branche `main` et le dossier `/ (root)`, puis **Save**.
5. Après une à deux minutes, le site est accessible à l'adresse :
   `https://ludovicdodin-cell.github.io/mon-cv-ia/`

## Personnalisation

- **Contenu** : tout le texte se trouve directement dans `index.html` et peut être modifié.
- **Contact par courriel** (optionnel) : un bouton est préparé mais désactivé dans la section Contact. Il est recommandé d'utiliser une adresse professionnelle dédiée plutôt qu'une messagerie personnelle avant de l'activer.
- **Photographie** (optionnelle) : aucune photo n'est intégrée. Son ajout relève d'un choix personnel et n'est pas nécessaire à la présentation.

## Identité visuelle

Le monogramme « LD » est serti dans un sceau ouvert, en laiton sur fond encre, en cohérence avec la charte du site. Trois fichiers sont fournis :

- `favicon.svg` : icône d'onglet, référencée dans `index.html`.
- `logo-mark.svg` : la marque seule, sur fond transparent, à réutiliser librement.
- `logo-lockup.svg` : le bandeau horizontal complet (marque, nom, accroche), utilisable en en-tête de documents ou en haut de ce README.

Pour afficher le bandeau en haut de ce README, ajouter la ligne suivante après avoir déposé les fichiers : `![Ludovic Dodin](logo-lockup.svg)`.

## Note de conformité (RGPD — minimisation des données)

Ce site est **public et indexable**. Par application du principe de minimisation des données et de la protection de la vie privée dès la conception, les éléments suivants ont été volontairement **exclus** de la page :

- adresse postale du domicile ;
- numéro de téléphone personnel ;
- date de naissance ;
- situation familiale.

Ces données ne présentent pas d'intérêt professionnel sur une page publique et leur diffusion augmente les risques d'usurpation d'identité, de démarchage et de biais de recrutement. La prise de contact est orientée vers un profil LinkedIn professionnel. Il est déconseillé de rétablir ces informations sur la version publique.

## Assistant IA (propulsé par Gemini)

La page intègre un assistant conversationnel permettant à un visiteur d'interroger le CV. Il repose sur l'API Google Gemini.

### Principe de sécurité (à respecter impérativement)

Une clé d'API est un **secret**. Elle ne doit **jamais** figurer dans `index.html` ni dans le dépôt : une page GitHub Pages est publique et son code est lisible par tous. La clé est donc conservée côté serveur, dans un **Cloudflare Worker** qui sert de proxy. Le navigateur n'appelle que le Worker ; le Worker seul détient la clé et interroge Gemini.

### Fichiers

- `worker.js` : le proxy. Il contient le contexte du CV, restreint l'origine autorisée (CORS), plafonne le volume de messages et ne journalise aucun contenu.
- `wrangler.toml` : la configuration de déploiement.

### Mise en place

1. Créer un compte gratuit sur Cloudflare, puis installer l'outil : `npm install -g wrangler`.
2. Dans un dossier contenant `worker.js` et `wrangler.toml`, se connecter : `npx wrangler login`.
3. Enregistrer la clé Gemini comme secret chiffré (elle n'est écrite nulle part en clair) :
   `npx wrangler secret put GEMINI_API_KEY` puis coller la clé lorsque l'outil la demande.
4. Déployer : `npx wrangler deploy`. L'outil affiche l'adresse publique du Worker,
   de la forme `https://cv-ia-proxy.<votre-sous-domaine>.workers.dev`.
5. Dans `worker.js`, vérifier que `ALLOWED_ORIGIN` correspond bien à l'adresse de votre site
   (`https://ludovicdodin-cell.github.io`), puis redéployer si vous l'avez modifiée.
6. Dans `index.html`, remplacer la valeur `WORKER_URL` (dans le script de l'assistant, en bas
   du fichier) par l'adresse du Worker obtenue à l'étape 4.
7. Publier `index.html` : l'assistant est opérationnel.

### Points de conformité (RGPD)

- L'API Gemini est un service tiers pouvant impliquer un transfert de données hors Union européenne. Un court avertissement invitant le visiteur à ne pas saisir de données personnelles figure sous le champ de saisie.
- Le contexte fourni au modèle ne contient aucune donnée personnelle sensible.
- Le Worker ne conserve aucun historique des échanges.
- Il est recommandé de suivre la consommation de la clé dans Google AI Studio et de définir un plafond d'usage pour maîtriser les coûts.
