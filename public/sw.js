/*
  Service worker minimal — il ne met RIEN en cache.

  Il existe uniquement parce que Chrome exige un service worker doté d'un
  gestionnaire `fetch` pour considérer un site comme installable et déclencher
  la proposition « Ajouter à l'écran d'accueil ».

  Volontairement passe-plat : mettre les pages en cache ferait afficher un
  compteur de visites périmé après un passage en caisse, ce qui est pire que
  pas de cache du tout. La carte doit toujours venir du serveur.
*/
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Aucune interception : le réseau fait son travail normalement.
});
