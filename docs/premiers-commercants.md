# Trouver les premiers commerçants

Ce document couvre ce qui se passe **avant** l'installation. Une fois le
commerçant convaincu, la marche à suivre est dans `recompens-notion.md`,
section « Accueillir un nouveau commerçant ».

---

## Par qui commencer

**Une connaissance, en premier.** À ce stade on ne vend pas, on vérifie que le
produit survit à un vrai comptoir avec de vrais clients pressés. Une
connaissance laisse revenir trois fois, dit quand c'est nul, et ne coûte pas
trois semaines de porte-à-porte.

**Le piège :** elle dira oui par gentillesse. Son accord ne vaut rien comme
signal. Ce qui compte, c'est que **ses clients scannent**.

**Le critère de succès, fixé avant de lui parler :** 15 cartes créées et
30 visites validées en 4 semaines. En dessous, le problème est dans le produit
ou dans le commerce choisi — et on le sait, au lieu de se raconter une histoire.

## Quel commerce

Le point faible du produit décide : **la carte vit dans le navigateur du
client.** Changement de téléphone ou cookies vidés, elle est perdue — sauf si le
client a donné son email à l'inscription, auquel cas il la retrouve seul via
`/retrouver-ma-carte`. L'email étant facultatif, une partie des cartes reste
irrécupérable.

| Viser | Éviter |
| --- | --- |
| Passage fréquent, cycle court : sandwicherie, café, boulangerie, snack | Cycle long : coiffeur (6 semaines), institut, opticien |

Sur un cycle long, la moitié des cartes seront mortes avant la deuxième visite.

## Ne pas dire « gratuit ». Dire « pilote ».

**Il n'y a aucune facturation dans le produit** — pas de Stripe, pas
d'abonnement, aucune notion de plan dans le schéma Prisma. Tout le monde est
gratuit aujourd'hui, y compris le dixième commerçant. La gratuité n'est donc
pas une offre : c'est l'état du produit, et il n'y a rien à offrir.

Le mot est piégeux en plus d'être faux : « gratuit » annonce qu'il y aura un
prix, ouvre une négociation qu'on ne peut pas tenir, et oblige à revenir un
jour dire « maintenant ça devient payant » — le pire moment pour parler
d'argent.

« Pilote » dit la vérité : elle teste, on apprend, le prix se discute quand le
produit aura prouvé qu'il sert à quelque chose.

**La contrepartie à demander**, sinon rien ne l'engage :

- l'affichette posée au comptoir, visible, pas sous la caisse
- elle scanne pendant 4 semaines, sans arrêter au bout de trois jours
- 20 minutes de retour honnête à la fin

## L'argumentaire

Ne pas commencer par présenter Recompens. Commencer par :

> **« Tu as une carte de fidélité en carton ? »**

La réponse décide de tout.

**Elle en a une.** C'est gagné, il n'y a rien à vendre. On ne change pas sa
règle, on enlève le carton que les clients perdent et le tampon qu'elle
cherche. Sa règle actuelle devient le seuil, telle quelle. Argument : elle
saura enfin combien de clients reviennent vraiment — le carton ne le lui a
jamais dit.

**Elle n'en a pas.** Plus dur : il faut d'abord la convaincre que la fidélité
vaut quelque chose. L'angle est la concurrence immédiate — ses clients hésitent
entre elle et deux autres enseignes à cent mètres, et la carte fait pencher.

Ensuite, trois phrases suffisent : le client scanne un QR au comptoir et tape
son prénom, elle scanne le téléphone du client à chaque passage, au 8e le
sandwich est offert. Aucune application à installer, ni pour elle ni pour eux.
Elle a besoin de son téléphone, rien d'autre.

**Y aller en personne**, à une heure creuse. Jamais entre 12 h et 14 h. Pas un
mail, pas un message.

## Ce qu'il faut dire soi-même, avant qu'elle le découvre

Annoncer les limites est ce qui fera qu'elle croit le reste.

- **La carte vit dans le navigateur du client.** Il change de téléphone ou vide
  ses cookies, il la perd — à moins d'avoir laissé son email, seul crochet qui
  permet de la retrouver. L'email est facultatif : **pousser les clients à le
  mettre est le geste le plus rentable du comptoir.** C'est à dire à la
  commerçante dès le premier jour.
- **Le compteur suit les passages, pas les articles.** Le client qui vient
  chercher les sandwichs de quatre collègues ne valide qu'une visite. Voir
  « Le client qui achète pour quatre » ci-dessous.

## Le seuil : viser plus bas que la carte carton

Le réflexe est 10 visites, comme le carton. Mais un pilote dure 4 semaines et
un habitué du midi passe 2 à 3 fois par semaine, soit 8 à 12 passages. À 10,
presque personne n'atteint la récompense avant la fin — et c'est précisément le
moment qu'il faut observer.

**Mettre 8 pendant le pilote.** Le seuil se remonte ensuite : relever le seuil
d'un programme ne reprend jamais une récompense déjà gagnée, c'est couvert par
les tests.

## Réglages type — sandwicherie

Tout se règle depuis `/admin`. Aucun accès à Supabase n'est nécessaire depuis
l'écran d'exploitation ajouté le 2026-09-03.

| Réglage | Valeur | Qui le fait |
| --- | --- | --- |
| Style de carte | `VESSEL` | toi, sur `/admin` |
| Silhouette | `SANDWICH` | toi, sur `/admin` |
| Couleur | sa couleur d'enseigne | toi, sur `/admin` |
| Délai anti-cumul | `120` minutes | toi, sur `/admin` |
| Nombre de visites | `8` pendant le pilote | elle, sur `/dashboard/program` |

La silhouette sandwich est la plus parlante des trois : elle se construit
couche par couche, on voit où en est le client sans lire le chiffre.

## Le client qui achète pour quatre

**Le cas :** une personne vient chercher les sandwichs de quatre collègues.
Elle repart avec quatre sandwichs et une seule visite créditée — le délai de
120 minutes bloque tout second scan sur sa carte.

**Ce n'est pas un bug.** Le produit compte des *passages*, pas des *articles*.
C'est un choix, et il se défend : c'est ce que fait une carte carton tamponnée
une fois par personne dans la file.

**Mais il est bancal**, et il faut le savoir : la personne qui achète pour
quatre est le plus gros ticket de la journée, et c'est elle qu'on récompense le
moins. C'est l'inverse de ce qu'une carte de fidélité est censée faire.

**Ne rien construire avant le pilote.** La question à poser à la commerçante,
puis à compter pendant les 4 semaines : *combien de fois par jour quelqu'un
achète-t-il pour plusieurs personnes ?*

- **Deux ou trois clients par semaine** — l'ignorer. Elle crédite une visite et
  dit au client que la carte compte les passages. Une phrase, pas un chantier.
- **Une part réelle du service du midi** — ce n'est pas un cas limite, c'est son
  métier, et il faut le construire.

**Le correctif, si le pilote le réclame :** un champ quantité sur
`/dashboard/scan`, « +N visites » avec N plafonné (3 ou 5). Le délai
anti-cumul s'appliquerait alors à l'événement de scan et non à chaque unité :
un scan crédite N visites, le scan suivant sur la même carte reste bloqué
120 minutes.

Le garde-fou ne saute pas pour autant. Le délai anti-cumul n'a jamais protégé
contre une commerçante complice — il protège une commerçante distraite. Avec un
champ quantité, elle doit regarder ce qu'elle tape ; elle a les quatre
sandwichs sous les yeux, elle est la mieux placée pour trancher.

À ne décider qu'avec des chiffres réels. Cette décision rejoint les
« Décisions produit en attente » de `recompens-notion.md`.
