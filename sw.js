// DCT 每日靈感 Service Worker v2.0
const CACHE_NAME = 'dct-inspire-v2';

self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(clients.claim()); });

// ── 30種鼓勵語 ──
const CHEERS = [
  '你今天的每一篇分享，都在種下一顆改變的種子 🌱',
  '堅持發文的人，終究會被對的人看見 👀',
  '不完美的開始，也比完美的等待更有力量 💪',
  '你分享的每一句話，都可能是某個人今天需要聽到的 🤍',
  '持續出現，就是你最強大的個人品牌 ✨',
  '今天發的文，是三個月後收入的種子 🌿',
  '你不是在賣東西，你是在幫助需要的人找到答案 💡',
  '每一個按讚，都是宇宙在說：繼續走，你走對了 🌟',
  '那些覺得你在洗版的人，不是你的客人，沒關係 😊',
  '你今天的勇敢出現，讓明天的自己更有底氣 🔥',
  '不要小看每天的小小積累，那是複利的力量 📈',
  '你的真實故事，就是最有力量的文案 📝',
  '發文這件事，沒有完美的時機，只有現在 ⏰',
  '每次按下發布，你就比昨天的自己更勇敢一點 🦋',
  '你願意每天出現，就已經贏過大多數人了 🏆',
  '不要等到準備好了才開始，邊走邊學才是真的成長 🚶‍♀️',
  '今天的你，比昨天更靠近夢想的自己 🎯',
  '你的堅持，會讓觀望的人因為你而做出改變 💫',
  '貼文不需要完美，真誠才是最打動人心的力量 ❤️',
  '你選擇做自己事業的主人，這個選擇本身就很了不起 👑',
  '每一天的努力，都是給未來的自己最好的禮物 🎁',
  '有人因為你今天的分享而改變，你不會知道是誰 🌈',
  '別怕發文，怕的話就閉眼按發布，發完就好了 😄',
  '你正在走一條很多人不敢走的路，繼續走 🛤️',
  '發文就像澆水，你不知道哪天花會開，但要每天澆 🌸',
  '你的影響力，比你想像的還要大 🌊',
  '今天多發一篇，就多一個機會讓對的人找到你 🔍',
  '不是每篇都爆紅，但每篇都在累積你的信任資產 💎',
  '你有故事、你有產品、你有心，這三樣加起來就夠了 🙌',
  '加油！今天的你很棒，明天的你會更棒 🌻',
];

// ── 當天文案（根據日期 seed 選取）──
function getDailySeed() {
  var d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}

function seededRand(seed, i) {
  var x = Math.sin(seed * 9301 + i * 49297 + 233) * 233280;
  return x - Math.floor(x);
}

function getTodayContent() {
  var seed = getDailySeed();
  
  // 今日鼓勵語
  var cheerIdx = Math.floor(seededRand(seed, 1) * CHEERS.length);
  var cheer = CHEERS[cheerIdx];
  
  // 今日發文建議（每天不同組合）
  var postTypes = [
    { icon: '🌟', type: '價值觀', hint: '分享你的成長故事或人生觀' },
    { icon: '📦', type: '產品動態', hint: '分享產品使用心得或客戶見證' },
    { icon: '💡', type: '觀念動態', hint: '分享瘦身/保養/保健知識' },
    { icon: '🤝', type: '招商動態', hint: '分享加入團隊的好處或解答疑問' },
  ];
  
  // 今日重點（隨機突出某一類）
  var focusIdx = Math.floor(seededRand(seed, 5) * postTypes.length);
  var focus = postTypes[focusIdx];
  
  return { cheer, focus };
}

// ── 推播通知 ──
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    var data = event.data.json();
    showNotif(data.title, data.body, data.url);
  } catch(e) {
    showNotif('💡 DCT 每日靈感', event.data.text(), '/DCTmap/dct-quest.html');
  }
});

function showNotif(title, body, url) {
  return self.registration.showNotification(title, {
    body: body,
    icon: '/DCTmap/icon-192.png',
    badge: '/DCTmap/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: url || '/DCTmap/dct-quest.html' },
    actions: [
      { action: 'open', title: '📋 開啟複製文案' },
      { action: 'close', title: '稍後' }
    ],
    requireInteraction: false
  });
}

// ── 點擊通知 ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  var url = (event.notification.data && event.notification.data.url) || '/DCTmap/dct-quest.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('dct-quest') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── 背景定時通知 ──
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-inspire-1' || event.tag === 'daily-inspire-2') {
    event.waitUntil(sendDailyNotification(event.tag));
  }
});

function sendDailyNotification(tag) {
  var content = getTodayContent();
  var isSecond = tag === 'daily-inspire-2';
  
  var title = isSecond
    ? '🌙 晚安提醒！今天發文了嗎？'
    : '☀️ 早安！今天的發文任務來了';
  
  var body = content.cheer + '\n\n'
    + '今日重點：' + content.focus.icon + ' ' + content.focus.type + '\n'
    + content.focus.hint + '\n\n'
    + '📋 點擊開啟 → 一鍵複製今日文案';
  
  return showNotif(title, body, '/DCTmap/dct-quest.html#inspire');
}

// ── Message 接收（從主頁面呼叫立即發通知）──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFY') {
    var content = getTodayContent();
    var title = event.data.title || '💡 DCT 每日靈感';
    var body = content.cheer + '\n\n'
      + '今日重點：' + content.focus.icon + ' ' + content.focus.type + '\n'
      + content.focus.hint + '\n\n'
      + '📋 點擊開啟 → 一鍵複製今日文案';
    event.waitUntil(showNotif(title, body, '/DCTmap/dct-quest.html#inspire'));
  }
});
