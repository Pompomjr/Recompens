# Recompens

La carte de fidélité de vos clients, sur leur téléphone. Aucune application à installer.

Le client scanne un QR posé sur le comptoir, tape son prénom, sa carte existe. À chaque passage, le commerçant scanne le QR du client et valide une visite. Au bout de N visites, la récompense se débloque.

**État : en ligne et fonctionnel.** Reste à trouver les premiers commerces pilotes.

---

## Accès et comptes

| Quoi | Où | Note |
| --- | --- | --- |
| Le site | https://recompens.com | Production |
| Code source | github.com/Pompomjr/Recompens | Dépôt public |
| Hébergement | Vercel | Se redéploie à chaque `git push` |
| Base de production | Supabase `ejghjhocrsjrvplayqev` | Les vrais commerçants |
| Base de développement | Supabase `iqynnitrnzitwdirzhrn` | Les essais |
| Envoi des mails | Resend, domaine `recompens.com` | Expéditeur `contact@recompens.com` |
| Domaines | OVH | `recompens.com` + `recompense.be` en redirection |
| Boîte mail | OVH Zimbra | `contact@recompens.com` |

Les anciens QR imprimés pointant sur `fidelizzz.vercel.app` continuent de fonctionner : l'adresse redirige vers `recompens.com` en conservant le chemin.

⚠️ **Ne jamais lancer `npm test` sur la base de production.** Les tests créent et suppriment des données réelles.

---

## La marque

**Nom :** Recompens — il dit ce que le client obtient, pas comment le commerçant l'enregistre.

**Vert :** `#2FBF71` sur fond sombre, `#1E8A50` sur fond clair.

**Trois formes de logo**, une par plage de tailles :

- Le mot complet, avec les deux E ajourés en vert — au-delà de 120 px de large
- La pastille ronde au R ajouré — de 24 à 64 px
- La pastille au R **plein** — en dessous de 24 px, où les entailles se referment

**Typographie :** Saira et Saira Stencil pour la marque, Archivo Black pour les titres, Instrument Sans pour le texte, IBM Plex Mono pour les numéros.

---

## Accueillir un nouveau commerçant

La marche à suivre, du premier contact à la première visite validée.

### 1. Créer son compte

Il s'inscrit lui-même sur https://recompens.com/register, ou vous le faites devant lui. Il reçoit un mail de confirmation depuis `contact@recompens.com`.

Si le mail n'arrive pas : Supabase → Authentication → Users → les trois points sur sa ligne → **Confirm email**.

### 2. Créer son programme

Nom, nombre de visites, récompense. Il obtient immédiatement son **QR code d'inscription**, à télécharger et imprimer.

Un seul programme par commerce. Il est modifiable et peut être arrêté, jamais supprimé.

### 3. Régler son style de carte

Supabase → **Table Editor** → table `merchants` → sa ligne :

| Colonne | Valeur |
| --- | --- |
| `brand_color` | Sa couleur, format `#14432E` |
| `card_style` | `TICKET` ou `VESSEL` |
| `vessel_shape` | `CUP`, `PASTA` ou `SANDWICH`, seulement si `VESSEL` |

Les trois silhouettes racontent la progression différemment : la tasse **se remplit**, la portion de pâtes **grossit**, le sandwich **se construit** couche par couche. La dernière est la plus parlante — on voit où en est le client sans lire le chiffre.

**Comment choisir :** `VESSEL` seulement si le contenant EST le produit qu'on vient chercher — une tasse chez un café, une assiette au restaurant. Chez un coiffeur ou un fleuriste, `TICKET`. Dans le doute, `TICKET` : il marche partout.

Effet immédiat, aucun redéploiement.

### 4. Régler son délai anti-cumul

Table `loyalty_programs` → colonne `min_minutes_between_visits`. C'est le temps minimum entre deux visites sur une même carte, qui empêche cinq amis d'utiliser le même QR à la même caisse.

| Métier | Délai |
| --- | --- |
| Restauration rapide | 60–120 |
| Restaurant | 180 |
| Coiffeur, institut | 1440 (une par jour) |
| Forte rotation | 0 (désactivé) |

### 5. Poser l'affichette

**Programme → Imprimer l'affichette.** Elle est générée depuis la base : nom
du commerce, règle, QR. Deux versions (claire, couleur du commerce) et deux
formats (A5 comptoir, A4 vitrine). Chaque modification du programme demande
une réimpression — c'est le prix d'une affichette qui ne ment jamais.

Impression : A5 sur 200 g mat suffit au début, jamais de brillant (le reflet
bloque le scan). Support : chevalet plexi A5 incliné, parce que la feuille se
change quand la règle change.

---

## Ce qui manque encore

### Décisions produit en attente

- [ ] **Cumul des récompenses** — les visites au-delà du seuil ne sont pas capitalisées. À trancher avec un vrai commerçant.
- [ ] **Le QR client est partageable** — une capture d'écran fonctionne. Le délai anti-cumul limite les dégâts. Le QR tournant est hors périmètre pour l'instant.

### Améliorations identifiées

- [ ] **« Ajouter à l'écran d'accueil »** après création de la carte — aujourd'hui, un client qui ferme l'onglet ne peut retrouver sa carte qu'en rescannant le QR en boutique.
- [ ] **Confirmer le mot de passe à l'inscription** — il n'est saisi qu'une fois ; une faute de frappe crée un compte inaccessible.
- [ ] **Écran d'administration** — pour régler style et délai sans passer par Supabase.
- [ ] **Liste des clients** dans le dashboard — encore un écran vide.
- [ ] **Nom et adresse modifiables** dans Paramètres — seul le logo l'est aujourd'hui.
- [ ] **Traduire les erreurs d'authentification** — certaines remontent en anglais.

---

## Si un commerçant perd son mot de passe

Il clique **Mot de passe oublié** sur la page de connexion, reçoit un lien, en choisit un nouveau et se retrouve connecté.

Le message affiché est le même que l'adresse existe ou non — c'est volontaire : dire « compte inconnu » permettrait à n'importe qui de découvrir quels commerçants sont inscrits.

Si le mail n'arrive pas, il est dans les indésirables neuf fois sur dix.

## Ce qui est garanti

Ces règles sont couvertes par 18 tests automatiques, rejoués à chaque modification :

- Un client ne peut **jamais** ajouter de visite lui-même
- Un commerçant ne peut **pas** toucher aux clients d'un autre commerce, ni même lire leur nom
- Une récompense ne peut **pas** être utilisée deux fois
- Chaque visite crée **exactement une** ligne d'historique
- Relever le seuil d'un programme ne reprend **jamais** une récompense déjà gagnée
- L'historique est **immuable** : ni correction, ni suppression

---

## Limites connues, à dire aux commerçants

**La carte vit dans le navigateur du client.** S'il change de téléphone ou vide ses cookies, il la perd. L'email, facultatif à l'inscription, est le seul crochet qui permettra un jour de la récupérer.

**Un client qui scanne depuis un autre navigateur** que celui où il s'est inscrit ne sera pas reconnu et créera une deuxième carte.

**Le premier mail peut arriver en indésirables.** Le domaine est neuf et sans historique d'envoi ; cela s'améliore à mesure qu'on envoie.
