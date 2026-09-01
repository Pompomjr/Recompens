# E-Loyalty MVP V0.1 — Cahier des charges

## 1. Objectif

Créer une plateforme SaaS de cartes de fidélité digitales pour commerces physiques.

Le client ne télécharge aucune application.

Le client possède une carte de fidélité digitale accessible depuis son téléphone.

Le commerçant utilise une web app mobile pour scanner le QR code du client et confirmer chaque visite.

### MVP

Le système doit permettre :

1. Création d'un compte commerçant
2. Création d'un programme de fidélité
3. Génération d'un QR d'inscription
4. Inscription d'un client
5. Création de sa carte de fidélité
6. Génération d'un QR client
7. Scan du QR par le commerçant
8. Validation d'une visite
9. Incrémentation du nombre de visites
10. Attribution d'une récompense
11. Utilisation de la récompense
12. Historique des opérations

### Hors périmètre V0.1

Ne PAS développer :
- système anti-fraude avancé
- QR tournant
- NFC
- application iOS
- application Android
- intégration caisse
- SMS marketing
- campagnes marketing
- IA
- système de points selon montant dépensé
- marketplace
- analytics avancés

---

## 2. Architecture

Stack recommandée :
- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- Prisma
- Vercel

Architecture :

Client → Carte fidélité → QR → Commerçant → Scanner → API → PostgreSQL

---

## 3. Rôles

### CUSTOMER

Peut :
- consulter sa carte
- consulter ses visites
- consulter sa récompense
- afficher son QR

Ne peut jamais :
- ajouter une visite
- supprimer une visite
- modifier son solde

### MERCHANT

Peut :
- gérer son commerce
- créer son programme
- voir ses clients
- scanner les clients
- valider une visite
- gérer les récompenses
- voir l'historique

### ADMIN

Peut :
- voir les commerces
- gérer les comptes
- désactiver un compte
- consulter les transactions
- gérer la plateforme

---

## 4. Modèle de données

### User

- id
- email
- role
- created_at
- updated_at

### Merchant

- id
- owner_id
- name
- logo_url
- address
- created_at
- updated_at

### LoyaltyProgram

- id
- merchant_id
- name
- description
- visits_required
- reward_name
- active
- created_at
- updated_at

Exemple :
- name = "Carte fidélité Café Dupont"
- visits_required = 10
- reward_name = "1 café offert"

### Customer

- id
- user_id
- first_name
- email
- created_at
- updated_at

### LoyaltyMembership

Cette table relie un client à un programme.

- id
- customer_id
- program_id
- visit_count
- reward_available
- created_at
- updated_at

### Transaction

Historique immuable.

- id
- membership_id
- merchant_id
- type
- visit_delta
- description
- created_by
- created_at

Types :
- VISIT
- REWARD_REDEEMED

---

## 5. Règle fondamentale

Le compteur de visites ne doit jamais être modifiable directement par le client.

Le seul moyen d'ajouter une visite est :

Merchant authentication
→ QR scan
→ membership verification
→ server-side validation
→ transaction created
→ visit_count + 1

Le frontend ne doit jamais être considéré comme une source de confiance.

---

## 6. Parcours commerçant

### Inscription

Landing page
→ Créer mon compte
→ Email / password
→ Nom commerce
→ Dashboard

### Dashboard

Afficher :
- nombre de clients
- visites du jour
- récompenses
- bouton principal "SCANNER UN CLIENT"
- programme fidélité
- clients
- historique
- paramètres

Le bouton SCANNER UN CLIENT doit être l'action principale.

---

## 7. Création du programme

Écran :

- Nom
- Visites nécessaires
- Récompense
- bouton CRÉER

Après création :
- afficher le QR d'inscription
- permettre de télécharger le QR

Ce QR permet au client de rejoindre le programme.

---

## 8. Parcours client

Le client scanne le QR du commerce.

Page :
- Bienvenue chez [Commerce]
- Prénom
- Email (optionnel)
- bouton "CRÉER MA CARTE"

Après inscription :

[Commerce]

X / Y visites

Encore Z visites

[ AFFICHER MON QR ]

---

## 9. QR client

Le QR client doit contenir un identifiant/token permettant de retrouver la LoyaltyMembership.

Il ne doit jamais contenir directement :
- visit_count
- informations sensibles

Le QR sert uniquement d'identifiant.

---

## 10. Scanner

Le commerçant clique sur "SCANNER UN CLIENT".

La caméra du téléphone s'ouvre.

QR détecté.

Le serveur récupère le membership.

Il vérifie :
- merchant connecté
- membership existe
- membership appartient au programme du merchant

Puis afficher :
- nom du client
- compteur actuel
- bouton "+1 VISITE"

Le commerçant confirme.

---

## 11. Validation

Lorsqu'il clique "+1 VISITE" :

BEGIN TRANSACTION

Create Transaction
visit_delta = +1

Update LoyaltyMembership
visit_count = visit_count + 1

IF visit_count >= visits_required:
    reward_available = true

COMMIT

L'ajout du point et la création de la transaction doivent être atomiques.

---

## 12. Récompense

Quand le compteur atteint le seuil :
- reward_available = true
- afficher la récompense au client
- afficher la récompense au commerçant

Le commerçant peut utiliser la récompense.

---

## 13. Utilisation de la récompense

Le serveur vérifie :
- reward_available == true

Puis :
- créer une transaction REWARD_REDEEMED
- remettre visit_count à 0
- reward_available = false

---

## 14. Historique

Le commerçant doit pouvoir voir :
- date
- heure
- client
- action
- variation

Le client doit pouvoir voir son activité.

---

## 15. Routes principales

Prévoir notamment :

- /api/auth
- /api/merchants
- /api/programs
- /api/customers
- /api/memberships
- /api/loyalty/scan
- /api/loyalty/visit
- /api/loyalty/redeem
- /api/transactions

Les noms exacts peuvent être adaptés à l'architecture Next.js.

---

## 16. Pages

### Public

- /
- /login
- /register
- /join/[programId]

### Client

- /customer
- /customer/card/[membershipId]

### Merchant

- /dashboard
- /dashboard/program
- /dashboard/customers
- /dashboard/scan
- /dashboard/history
- /dashboard/settings

### Admin

- /admin
- /admin/merchants
- /admin/customers
- /admin/transactions

---

## 17. Design

Design :
- simple
- premium
- moderne
- mobile-first

Le commerçant doit pouvoir effectuer une validation en quelques secondes.

Priorité :
SCAN → CLIENT → VALIDER

Ne pas remplir le dashboard de graphiques inutiles.

---

## 18. Sécurité minimale

Même sans système anti-fraude avancé :

### Client → +1 visite
Impossible.

### Merchant A → client Merchant B
Impossible.

### Client → modifier son compteur
Impossible.

### Client → appeler directement l'API de validation
Refusé.

### Reward → utilisation deux fois
Impossible.

### Chaque visite
Exactement une transaction.

Les autorisations doivent être vérifiées côté serveur.

---

## 19. Architecture des fichiers recommandée

e-loyalty/
│
├── app/
│   ├── (public)/
│   ├── customer/
│   ├── dashboard/
│   ├── admin/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── merchant/
│   ├── customer/
│   └── scanner/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── loyalty/
│   ├── qr/
│   └── validation/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
│
├── public/
│
├── .env.example
├── SPEC.md
└── README.md

---

# 20. Ordre de développement

## Étape 01 — Projet
Next.js / TypeScript / Tailwind

## Étape 02 — Supabase + Prisma
Base de données

## Étape 03 — Auth
Commerçant / client

## Étape 04 — Merchant
Dashboard

## Étape 05 — Loyalty program
Création du programme

## Étape 06 — Customer
Inscription client

## Étape 07 — QR
Génération des QR

## Étape 08 — Scanner
Caméra mobile

## Étape 09 — Validation
+1 visite

## Étape 10 — Reward
Récompense

## Étape 11 — Historique
Transactions

## Étape 12 — Tests
Sécurité + logique métier

## Étape 13 — Apple Wallet
Intégration

## Étape 14 — Google Wallet
Intégration

## Étape 15 — Déploiement

---

# 21. Prompt initial pour Claude Code

Après avoir placé SPEC.md dans le projet, utiliser :

"Read SPEC.md completely.

You are working on the E-Loyalty MVP described in this document.

Before writing any code:

1. Analyze the requirements.
2. Identify ambiguities or technical risks.
3. Propose the architecture.
4. Propose the database schema.
5. Propose the implementation order.

Do NOT modify files yet.

Wait for approval."

---

# 22. Objectif du MVP

Le MVP est considéré comme fonctionnel lorsque le scénario suivant fonctionne de bout en bout :

Commerce
→ crée son programme

Client
→ scanne le QR du commerce
→ s'inscrit
→ obtient sa carte

Client
→ présente son QR

Commerçant
→ scanne le QR
→ confirme "+1"

Client
→ voit son compteur augmenter

Lorsque le seuil est atteint :
→ récompense disponible

Commerçant
→ utilise la récompense

Toutes les opérations
→ apparaissent dans l'historique.

Objectif : mettre ce MVP entre les mains des 10 premiers commerces pilotes avant d'ajouter des fonctionnalités avancées.
