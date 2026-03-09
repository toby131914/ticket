// background.js - Service Worker

// 接收來自 GitHub Pages 的訊息
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ status: 'ok', version: '1.0' });
    return true;
  }

  if (message.action === 'startSniper') {
    const { url, targetTime, profile } = message;
    // 儲存設定
    chrome.storage.local.set({ sniperConfig: { url, targetTime, profile, status: 'waiting' } });
    scheduleSniper(url, targetTime, profile);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get('sniperConfig', (data) => {
      sendResponse(data.sniperConfig || { status: 'idle' });
    });
    return true;
  }

  if (message.action === 'stop') {
    chrome.alarms.clear('sniperTick');
    chrome.storage.local.set({ sniperConfig: { status: 'idle' } });
    sendResponse({ success: true });
    return true;
  }
});

// 內部訊息（popup）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    chrome.storage.local.get('sniperConfig', (data) => {
      sendResponse(data.sniperConfig || { status: 'idle' });
    });
    return true;
  }
});

function scheduleSniper(url, targetTime, profile) {
  // 計算幾毫秒後觸發
  const now = new Date();
  const [h, m, s] = targetTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, s, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // 明天

  const delayMs = target - now;

  // 用 setTimeout 在 background 等待（service worker 短暫）
  // 改用 chrome.alarms 更可靠
  const delayMin = delayMs / 60000;
  chrome.alarms.create('sniperTick', { delayInMinutes: Math.max(delayMin, 0.017) });

  // 同時用 setTimeout 處理秒級精度（alarms 最小1分鐘）
  if (delayMs < 65000) {
    setTimeout(() => openAndFill(url, profile), delayMs);
  }

  chrome.storage.local.set({
    sniperConfig: {
      url, targetTime, profile,
      status: 'waiting',
      message: `等待中，目標時間 ${targetTime}`
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sniperTick') {
    chrome.storage.local.get('sniperConfig', (data) => {
      if (data.sniperConfig && data.sniperConfig.status === 'waiting') {
        openAndFill(data.sniperConfig.url, data.sniperConfig.profile);
      }
    });
  }
});

function openAndFill(url, profile) {
  chrome.storage.local.set({
    sniperConfig: { status: 'opening', message: '開啟表單中...', url, profile }
  });

  chrome.tabs.create({ url, active: true }, (tab) => {
    // 等待頁面載入後注入填表邏輯
    const checkReady = setInterval(() => {
      chrome.tabs.get(tab.id, (t) => {
        if (t && t.status === 'complete') {
          clearInterval(checkReady);
          chrome.storage.local.set({
            sniperConfig: { status: 'filling', message: '填寫中...', url, profile }
          });
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillForm,
            args: [profile]
          });
        }
      });
    }, 300);
  });
}

function fillForm(profile) {
  // 這個函式會被注入到 Google Forms 頁面執行
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function run() {
    await sleep(800);

    // 取消記錄 email 勾選
    try {
      const emailCb = document.querySelector('[role="checkbox"][aria-label*="記錄"]');
      if (emailCb && emailCb.getAttribute('aria-checked') === 'false') emailCb.click();
    } catch(e) {}

    function setVal(el, v) {
      if (!el) return;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) nativeInputValueSetter.call(el, v);
      else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    const questions = document.querySelectorAll('[role="listitem"], .geS5ce');
    questions.forEach(q => {
      const txt = q.innerText.toLowerCase();
      const inp = q.querySelector('input, textarea');
      if (!inp) return;
      let val = '';
      if (/郵件|email|信箱|電子/.test(txt)) val = profile.email;
      else if (/暱稱|nickname|代號|稱呼/.test(txt)) val = profile.nick;
      else if (/姓名|名字|名稱|真實|填寫人/.test(txt)) val = profile.name;
      else if (/手機|電話|phone|mobile|號碼|聯絡/.test(txt)) val = profile.phone;
      if (val) setVal(inp, val);
    });

    // 指名選項
    if (profile.key) {
      const opts = document.querySelectorAll('[role="radio"], [role="checkbox"]');
      for (const opt of opts) {
        const t = opt.getAttribute('data-value') || opt.innerText || '';
        if (t.includes(profile.key)) {
          opt.scrollIntoView({ block: 'center' });
          opt.click();
          break;
        }
      }
    }

    window.scrollTo(0, document.body.scrollHeight);

    // 通知 background 完成
    chrome.runtime.sendMessage({ action: 'fillDone' });
  }

  run();
}
