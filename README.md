# E-Loyalty MVP — V0.1

Plateforme SaaS de cartes de fidélité digitales. Voir `SPEC.md` pour le cahier des charges complet.

## État du scaffold (Étapes 01-12 terminées)

- [x] Next.js 15 + TypeScript + Tailwind (App Router)
- [x] Arborescence de fichiers (`app/`, `components/`, `lib/`, `prisma/`, `tests/`)
- [x] Schéma Prisma complet (`prisma/schema.prisma`) — User, Merchant,
      LoyaltyProgram, Customer, LoyaltyMembership, Transaction
- [x] Client Prisma singleton (`lib/db/prisma.ts`)
- [x] Clients Supabase browser/server (`lib/auth/supabase-browser.ts`, `supabase-server.ts`)
- [x] Helpers de session/rôles (`lib/auth/session.ts`) — `requireMerchant()`,
      `requireCustomer()`
- [x] Logique métier centrale (`lib/loyalty/visit.ts`) — `addVisit()`,
      `redeemReward()`, avec les contrôles de sécurité du §18 déjà en place
- [x] Génération QR (`lib/qr/generate.ts`)
- [x] Landing page minimale (`/`)

### Étape 03 — Auth

- [x] Validation des formulaires avec zod (`lib/validation/auth.ts`)
- [x] Server Actions d'auth (`lib/auth/actions.ts`) — inscription commerçant,
      connexion, déconnexion
- [x] `proxy.ts` (ex-`middleware.ts`, renommé en Next 16) — rafraîchit la session Supabase à chaque requête
      (pattern `@supabase/ssr`) et redirige tôt sur `/dashboard/*`,
      `/customer/*`, `/admin/*`
- [x] Pages publiques `/login` et `/register` (`app/(public)/`)
- [x] Barrières serveur `app/dashboard/layout.tsx` (`requireMerchant()`) et
      `app/customer/layout.tsx` (`requireCustomer()`)
- [x] Pages placeholder `/dashboard` et `/customer` (remplacées aux étapes 04 et 06)

### Étape 04 — Dashboard commerçant

- [x] Statistiques serveur (`lib/dashboard/stats.ts`) — clients, visites du
      jour, récompenses disponibles, toutes filtrées par `merchantId`
- [x] `/dashboard` (§6) — bouton principal "SCANNER UN CLIENT", 3 tuiles de
      stats, encart programme, navigation
- [x] Composants (`components/merchant/`) — `StatCard`, `NavCard`,
      `StepPlaceholder`
- [x] Sous-pages `/dashboard/{program,customers,scan,history,settings}` en
      placeholder, pour éviter les liens morts

### Étape 05 — Programme de fidélité

- [x] Validation zod (`lib/validation/program.ts`) — `visitsRequired` borné
      entre 1 et 100 côté serveur
- [x] Server Action (`lib/programs/actions.ts`) — `merchantId` pris dans la
      session, jamais dans le formulaire ; un seul programme par commerce en V0.1
- [x] `/dashboard/program` (§7) — formulaire Nom / Visites / Récompense, puis
      fiche du programme
- [x] QR d'inscription affiché et téléchargeable, via `generateProgramJoinQr()`

### Étape 06 — Parcours client

- [x] `/join/[programId]` (§8) — page publique atteinte via le QR du commerce
- [x] Server Action (`lib/customers/actions.ts`) — session **anonyme** Supabase
      (le §8 ne demande ni mot de passe ni confirmation), puis User + Customer
      + carte créés dans une seule écriture imbriquée
- [x] `/customer` — liste des cartes ; `/customer/card/[membershipId]` (§8) —
      compteur X/Y, visites restantes, récompense (§12), bouton AFFICHER MON QR
- [x] QR client via `generateCustomerQr()` — n'encode que `qrToken` (§9)
- [x] Contrôle d'appartenance de la carte au client authentifié (§18)

### Ajout hors SPEC — délai anti-cumul

- [x] Contrôle dans `addVisit()` : une même carte ne peut pas être créditée
      deux fois en moins de N minutes
- [x] **Une valeur par commerce**, colonne
      `LoyaltyProgram.minMinutesBetweenVisits` (défaut 30, `0` désactive)
- [x] `LOYALTY_MIN_MINUTES_BETWEEN_VISITS` ne fixe plus que la valeur donnée
      aux programmes NOUVELLEMENT créés
- [ ] À terme : écran d'administration (§3 rôle ADMIN, §16 `/admin`) pour
      régler ce délai sans passer par Supabase

#### Changer le délai d'un commerce

Le commerçant ne voit pas ce réglage : c'est un paramètre d'exploitation.
Dans Supabase → **Table Editor** → table `loyalty_programs` → colonne
`min_minutes_between_visits` → modifier la ligne du commerce concerné.

Prise en compte immédiate, sans redéploiement : la valeur est lue en base à
chaque validation de visite.

Ordres de grandeur : restauration rapide 60-120, restaurant 180, coiffeur ou
institut 1440 (une visite par jour), commerce à forte rotation 0 (désactivé).

### Étape 08 — Scanner

- [x] `lib/loyalty/scan.ts` — lecture seule, refait les contrôles
      d'appartenance du §18 avant de révéler quoi que ce soit
- [x] `POST /api/loyalty/scan` (§15) — `requireMerchant()` rappelé dans la
      route : un layout ne protège pas un Route Handler
- [x] `components/scanner/qr-scanner.tsx` — caméra + décodage `jsqr`
- [x] `/dashboard/scan` (§10) — nom du client, compteur, bouton "+1 VISITE"
      (branché à l'étape 09)
- [x] Saisie manuelle du code, pour tester sans caméra
- **Dépendance ajoutée** : `jsqr` (~30 Ko, Apache 2.0)

### Étape 09 — Validation +1 visite

- [x] `POST /api/loyalty/visit` (§15) — authentifie puis délègue à `addVisit()`,
      sans logique métier propre : l'atomicité du §11 reste dans `lib/loyalty/visit.ts`
- [x] Bouton "+1 VISITE" actif sur `/dashboard/scan`, désactivé pendant l'appel
      pour qu'un double-clic ne parte pas deux fois
- [x] Le refus du délai anti-cumul remonte tel quel au commerçant
- [x] Vérifié : `POST /api/loyalty/{scan,visit}` sans session → HTTP 401
      (cf SPEC §18 : "Client → appeler directement l'API de validation : Refusé.")

### Étape 10 — Récompense

- [x] `POST /api/loyalty/redeem` (§15) — délègue à `redeemReward()`, qui
      revérifie `reward_available` dans la même transaction que la remise à
      zéro : la double utilisation est impossible (§18)
- [x] Bouton "UTILISER LA RÉCOMPENSE" sur `/dashboard/scan`, en confirmation
      à deux temps (le geste est irréversible)
- [x] `lib/loyalty/scan.ts` refactorisé — `findMembershipByQrToken()` et
      `findMembershipById()` partagent les contrôles du §18
- [x] Vérifié : `POST /api/loyalty/redeem` sans session → HTTP 401

### Étape 11 — Historique

- [x] `lib/transactions/queries.ts` — lecture seule de l'historique immuable ;
      côté commerçant filtré par `merchantId`, côté client par carte
- [x] `/dashboard/history` (§14) — date, heure, client, action, variation ;
      liste sur mobile, tableau dès `sm:`
- [x] Section "Mon activité" sur la carte client (§14)
- [x] `lib/format.ts` — fuseau `Europe/Brussels` fixé explicitement, sinon un
      serveur en UTC décale les heures affichées
- Pas de route `/api/transactions` : les deux vues sont des Server Components
  qui lisent directement en base (le §15 autorise l'adaptation à Next.js)

### Étape 12 — Sécurité + tests

- [x] `vitest` (dépendance de développement uniquement), `npm test`
- [x] `tests/loyalty.test.ts` — 12 tests contre la vraie base, couvrant §11,
      §13 et §18 ; chaque test crée puis supprime son propre commerce et son
      propre client, les données de dev ne sont pas touchées
- [x] `tests/setup.ts` — charge `.env` (vitest ne le fait pas) et fige le délai
      anti-cumul à 30 min pour que la suite soit déterministe
- [x] Alias `@/` reproduit dans `vitest.config.mts`, sans dépendance de plus
- Non couverts par la suite : "client → +1 visite" et "client → appelle l'API"
  se jouent au niveau HTTP et exigeraient un serveur lancé. **Vérifiés
  manuellement** : `POST /api/loyalty/{scan,visit,redeem}` sans session → 401

## Pour démarrer en local

```bash
npm install
cp .env.example .env
# Remplir DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

npm run db:generate   # génère le client Prisma
npm run db:push       # crée les tables sur Supabase (dev rapide)
npm run dev
```

## Tests

```bash
npm test          # lance la suite une fois
npm run test:watch
```

Les tests écrivent dans la base pointée par `DATABASE_URL` : à ne PAS lancer
contre la base de production.

## Configuration Supabase requise

Dans le dashboard Supabase, **Authentication → Sign In / Providers** :

- **Anonymous sign-ins** doit être ACTIVÉ — c'est ce qui permet au client de
  créer sa carte avec un simple prénom, sans mot de passe (§8) ;

Puis, sur le provider **Email** :

- activer le provider Email/Password ;
- si « Confirm email » est activé, l'inscription commerçant n'ouvre pas de
  session immédiatement : le formulaire affiche alors « vérifiez votre boîte
  mail » au lieu de rediriger vers `/dashboard`. Pour tester le flux complet
  en local, désactiver la confirmation ;
- **Authentication → URL Configuration** : `Site URL` = `http://localhost:3000`
  en dev.

## Déploiement (Vercel + Supabase)

Deux projets Supabase distincts : un pour le développement, un pour la
production. `npm test` écrit dans la base pointée par `DATABASE_URL` — le
faire tourner contre la prod créerait et supprimerait des données chez de
vrais commerçants.

### Réglages à faire dans le projet Supabase de production

- **Authentication → Sign In / Providers → Anonymous sign-ins** : activé.
  Sans lui, le §8 ne fonctionne pas : aucun client ne peut créer sa carte.
- **Email → Confirm email** : activé en production (désactivé en dev pour
  aller vite). Le commerçant confirme son adresse, puis se connecte.
- **Authentication → URL Configuration → Site URL** : l'URL de production.
  C'est la cible des liens de confirmation par mail ; laissée sur
  `localhost:3000`, elle rend ces liens inutilisables.

### Variables d'environnement Vercel

| Variable | Remarque |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | projet de PROD |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | projet de PROD |
| `SUPABASE_SERVICE_ROLE_KEY` | projet de PROD |
| `DATABASE_URL` | pooler, port 6543, `?pgbouncer=true` |
| `DIRECT_URL` | connexion directe, port 5432 |
| `NEXT_PUBLIC_APP_URL` | l'URL de production — encodée dans le QR d'inscription |
| `LOYALTY_MIN_MINUTES_BETWEEN_VISITS` | `30` en production |

`NEXT_PUBLIC_APP_URL` est inlinée au build : la modifier exige un
redéploiement, pas seulement un redémarrage.

### Créer les tables de production

Les identifiants de prod vivent dans `.env.production.local` (ignoré par git).
Charger ce fichier dans l'environnement, puis `npx prisma db push`.

### Déclencher un déploiement

Vercel ne déploie en production que sur un push vers la branche par défaut du
dépôt. Un dépôt poussé AVANT la connexion à Vercel ne déclenche rien : il faut
un nouveau commit.

## Design

Deux univers volontairement distincts (cf SPEC §17) :

- **Côté client** — du papier. La carte est un *ticket* : fond crème grainé,
  perforation, numéro de série, tampons posés de travers. Elle doit ressembler
  à un objet qu'on possède, lisible à un mètre dans une boutique très éclairée.
- **Côté commerçant** — du noir et blanc. Il travaille avec, en vitesse,
  derrière un comptoir. Grosses cibles tactiles, aucune fantaisie.

### Typographie

Chargée par `next/font` dans `app/layout.tsx` : **Archivo Black** (titres et
grands chiffres), **Instrument Sans** (texte), **IBM Plex Mono** (numéros de
carte et libellés du ticket). Avant ça, `globals.css` référençait une variable
`--font-geist-sans` que rien ne chargeait : l'app s'affichait en Arial.

### Couleur par commerce

Une seule valeur en base, `Merchant.brandColor` (hex, défaut `#A63A28`), suffit
à décliner la carte : encre des tampons, bouton, accents. Le papier et le texte
ne changent pas — c'est ce qui donne une famille reconnaissable plutôt qu'un
patchwork. `lib/theme.ts` en dérive une couleur de texte lisible, pour qu'un
commerçant qui choisit un jaune vif n'obtienne pas un bouton illisible.

Le commerçant ne choisit pas sa couleur : comme le délai anti-cumul, c'est un
réglage d'exploitation. Supabase → **Table Editor** → `merchants` → colonne
`brand_color`. Effet immédiat, sans redéploiement.

Un seul gabarit de carte pour tous les métiers, donc **aucun visuel à produire
pour accueillir un nouveau commerçant**.

### Deux styles de carte

`Merchant.cardStyle` vaut `TICKET` (défaut) ou `VESSEL`.

- **TICKET** — universel. Aucun dessin propre à un métier, il convient à
  n'importe quel commerce. C'est le choix par défaut, et celui d'un commerce
  dont on ne sait pas encore quoi faire.
- **VESSEL** — le contenant du commerce se remplit. À réserver aux métiers
  dont le contenant EST le produit : une tasse chez un café, une assiette au
  restaurant. Chez un coiffeur, un flacon ne raconte rien — on a essayé.

Quand `cardStyle = VESSEL`, `Merchant.vesselShape` choisit la silhouette
(`CUP`, `PASTA`). Les silhouettes vivent dans `lib/loyalty/vessels.ts` :
géométrie, couleur du contenu et garniture. Ajouter un métier = ajouter une
entrée dans ce fichier et une valeur à l'enum.

**VESSEL sans silhouette retombe sur TICKET** : un réglage incomplet ne casse
jamais la carte d'un client.

La couleur du CONTENU appartient à la silhouette, pas au commerce — des pâtes
sont couleur pâtes. Seul le fond de la carte vient de `brandColor`.

### Mouvement

La carte ouverte dans les deux minutes qui suivent une visite validée
(`STAMP_ANIMATION_WINDOW_MS`) joue sa séquence, une fois :

- **TICKET** — le dernier tampon s'abat sur le papier, l'encre bave.
- **VESSEL** — le contenu monte d'un cran et le chiffre saute. Le geste de la
  mascotte dépend de la silhouette (`gesture` dans `lib/loyalty/vessels.ts`) :
  - `drop` — elle TOMBE dans le contenant. Le geste le plus fort, mais il
    suppose un contenant ouvert par le haut et un objet crédible : un grain
    de café dans une tasse. Sa zone de chute est découpée et s'arrête à
    l'ouverture, sinon elle a l'air de passer devant le contenant.
  - `streak` — elle TRAVERSE l'écran et sort par le coin. Marche partout,
    y compris quand rien ne tombe naturellement dans le contenant : rien ne
    tombe dans une assiette de pâtes.

Aucune boucle : c'est une récompense, pas une animation d'ambiance — et un
écran qui gigote vide la batterie. Le réglage système « réduire les
animations » est respecté.

## Reste à faire

Par ordre d'importance, hors périmètre V0.1 déjà livré.

### Bloquant pour un usage réel

- [ ] **Modifier un programme après création.** Aujourd'hui un commerçant qui
      se trompe de récompense ou de nombre de visites est coincé : ni édition
      ni suppression. C'est la limite la plus gênante du MVP.
- [ ] **Envoi des mails.** Le service intégré de Supabase est limité à
      quelques mails par heure et part en indésirables. Il faut un SMTP
      externe (Resend si domaine, Brevo sinon). Dépend du choix du nom.
      En attendant : confirmer les comptes à la main dans Supabase →
      Authentication → Users → ⋯ → Confirm email.

### Décisions produit en attente

- [ ] **Nom et domaine.** Conditionne l'envoi des mails, l'identité visuelle
      et l'URL des QR. `fidelizz.com` et `fidelizz.fr` sont déjà pris.
- [ ] **Cumul des récompenses.** Les visites au-delà du seuil ne sont pas
      capitalisées aujourd'hui, et une seule récompense est en attente à la
      fois. À trancher avec un vrai commerçant.

### Design, suite

- [ ] **Silhouettes supplémentaires** — saladier (sandwicherie), verre
      (bar), flacon. `CUP` et `PASTA` sont faites.
- [ ] **Logo du commerce** — `Merchant.logoUrl` existe mais n'est pas encore
      affiché ; la carte utilise l'initiale du nom.

### Améliorations identifiées

- [ ] **Écran d'administration** (§3 rôle ADMIN, §16 `/admin`) — réglerait
      notamment le délai anti-cumul sans passer par le Table Editor.
- [ ] **Récupération d'une carte perdue.** L'identité client tient à un
      cookie : changement de téléphone ou cookies effacés = carte perdue.
      L'email optionnel est le crochet prévu pour un lien de récupération.
- [ ] **Écran Paramètres** du commerce (nom, logo, adresse).
- [ ] **Liste des clients** (`/dashboard/customers`), encore en placeholder.

## Points d'architecture à retenir

- Le compteur de visites (`visit_count`) n'est **jamais** modifié depuis le
  client. Seul `lib/loyalty/visit.ts` y touche, après vérification serveur
  du merchant authentifié et de l'appartenance du membership à son programme.
- Le QR client encode uniquement `LoyaltyMembership.qrToken` (uuid opaque),
  jamais l'id métier ni le compteur.
- Chaque visite ou rédemption = exactement une `Transaction`, créée dans la
  même transaction DB que la mise à jour du membership (atomicité).
- Le QR client étant un token fixe (le QR tournant est hors périmètre V0.1),
  il peut être partagé par capture d'écran. Le délai minimum entre deux visites
  (`LOYALTY_MIN_MINUTES_BETWEEN_VISITS`) limite le cumul d'achats sur une seule
  carte. Il ne remplace pas un vrai anti-fraude.
- Une adresse déjà inscrite ne renvoie PAS d'erreur claire côté Supabase :
  pour ne pas révéler qui a un compte, l'API renvoie un utilisateur avec un id
  **fabriqué** et une liste `identities` vide. Créer une ligne métier sur cet
  id produit un enregistrement orphelin, que plus rien ne rattache au vrai
  compte — la connexion échoue alors définitivement. `registerMerchantAction`
  teste donc `identities.length === 0` avant toute écriture.
- Une inscription qui échoue à mi-chemin est **annulée** : si le compte
  Supabase est créé mais que l'écriture en base échoue, `deleteAuthUser()`
  supprime le compte. Sans ça, la personne est enfermée — la connexion répond
  « compte incomplet », la réinscription « adresse déjà utilisée », et il n'y
  a plus d'issue. C'est arrivé en vrai.
- `User.id` est **l'id Supabase Auth** : c'est la jointure utilisée par
  `getCurrentUser()`. L'inscription crée le compte Supabase puis `User` +
  `Merchant` dans une seule écriture Prisma imbriquée (donc une transaction).
- Le rôle stocké dans `user_metadata` Supabase sert **uniquement** au routage
  du middleware (runtime Edge, pas d'accès Prisma). Il est modifiable par
  l'utilisateur lui-même : la source de vérité reste `User.role` en base,
  revérifié par `requireMerchant()` / `requireCustomer()` dans les layouts et
  dans chaque route API.
