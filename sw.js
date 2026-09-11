// このファイルは「オフラインでもアプリを開けるようにする」ための仕組みです。
// 中身を理解する必要はありません。触らずそのまま使ってください。
//
// [修正] 以前は一度キャッシュした内容をずっと使い続ける設定だったため、
// ホーム画面に追加したアプリだけ更新が反映されない問題があった。
// ネットに繋がっている時は常に最新を取得し、オフラインの時だけ
// 保存済みの内容を使う方式に変更した。

var CACHE_NAME = "health-tracker-cache-v2";
var FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse){
        // 取得できたら、次にオフラインになったとき用にキャッシュも更新しておく
        var responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, responseCopy);
        });
        return networkResponse;
      })
      .catch(function(){
        // オフラインなどでネットに繋がらない時だけ、保存済みの内容を使う
        return caches.match(event.request);
      })
  );
});
