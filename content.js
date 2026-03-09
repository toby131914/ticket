// content.js - 注入到 Google Forms 頁面

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fillDone') {
    chrome.storage.local.get('sniperConfig', (data) => {
      const cfg = data.sniperConfig || {};
      chrome.storage.local.set({
        sniperConfig: { ...cfg, status: 'done', message: '✅ 填寫完成！請確認後送出。' }
      });
    });
  }
});
