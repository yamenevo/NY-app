self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('push',e=>{let p={};try{p=e.data.json()}catch{}
  e.waitUntil(self.registration.showNotification(p.title||'NY',{body:p.body||'',icon:'/logo.png',tag:p.tag||'ny',renotify:true,dir:'rtl',lang:'ar',data:{url:p.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=e.notification.data.url||'/';
  e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l){if('focus' in c){c.navigate(u);return c.focus()}}return clients.openWindow(u)}))});
