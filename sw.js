// DCT 每日靈感 Service Worker v1.0
const CACHE_NAME = 'dct-inspire-v1';

// 安裝
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 啟動
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// 推播通知收到
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || '今天的靈感等你！',
    icon: data.icon || '/DCTmap/icon-192.png',
    badge: data.badge || '/DCTmap/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/DCTmap/dct-quest.html' },
    actions: [
      { action: 'open', title: '📋 開啟靈感頁面' },
      { action: 'close', title: '稍後再說' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '💡 DCT 每日靈感', options)
  );
});

// 點擊通知
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('dct-quest') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// 背景同步：每天定時自動排程通知
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-inspire') {
    event.waitUntil(sendDailyNotification());
  }
});

async function sendDailyNotification() {
  const now = new Date();
  const hour = now.getHours();
  
  // 決定通知內容
  let title, body;
  if (hour >= 7 && hour < 10) {
    title = '☀️ 早安！今日發文提醒';
    body = '記得今天要發：價值觀×1、產品×5、觀念×1、招商×2\n開啟靈感頁面獲取今日文案 💡';
  } else if (hour >= 19 && hour < 22) {
    title = '🌙 晚上好！課程提醒';
    body = '今天的課程完成了嗎？記得進入系統確認進度！';
  } else {
    title = '💡 DCT 每日靈感';
    body = '今天的發文文案已更新，點擊查看！';
  }

  return self.registration.showNotification(title, {
    body,
    icon: '/DCTmap/icon-192.png',
    badge: '/DCTmap/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/DCTmap/dct-quest.html' },
    tag: 'daily-inspire',
    renotify: true
  });
}
