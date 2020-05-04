console.log("SERVICE WORKER CONNECTED");

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/manifest.webmanifest",
  "db.js",
  "/index.js",
  "/favicon.ico",
  "/assets/images/icons/icon-192x192.png",
  "/assets/images/icons/icon-512x512.png",
//   "/https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
//   "/https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
];
//the version (v1) here can be changed whenever the list of files to be cached is updated.
//this is fo the static assets
const CACHE_NAME = "static-cache-v3";
//this is for the things that change often, like AJAX requests
const DATA_CACHE_NAME = "data-cache-v2";

//INSTALL the code below will add our files to the cache.
self.addEventListener("install", (evt) => {
  //wait until the service worker us regstered and any previous service workers have gone idle
  evt.waitUntil(
    //cashes requests and responses
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  //if there is a previous service worker, dont wait for it to go idle, just take over now
  self.skipWaiting();
});

//ACTIVATE - 
self.addEventListener("activate", (evt) => {
  //dont let the service worker go idle until the promise passed to waituntil resolves
  // wait until all outdated caches have been deleted
  evt.waitUntil(
    // look into caches and look at all of the cache names
    caches.keys().then((keyList) => {
      return Promise.all(
        // map through each one of the keys and retuen a promise to delete any caches that dont have the name of the current cache
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH
// listen for any kind of event and before going to the server check to see if the response has already been cached
// if not cached then go ahead and send a request over the network to the server.
self.addEventListener("fetch", (evt) => {
    // cache successful requests to the API
    if (evt.request.url.includes("/api")) {
      evt.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then((cache) => {
            return fetch(evt.request)
              .then((response) => {
                // If the response was good, clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put(evt.request.url, response.clone());
                }
  
                return response;
              })
              .catch(() => {
                // Network request failed, try to get it from the cache.
                return cache.match(evt.request);
              });
          })
          .catch((err) => console.log(err))
      );
      // stop execution of the fetch event callback
      return;
    }
  
    // if the request is not for the API, serve static assets using
    // "offline-first" approach.
    evt.respondWith(
      caches.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      })
    );
  });