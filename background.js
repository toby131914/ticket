// background.js - Service Worker

// ── 外部訊息（來自 GitHub Pages）──
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ status: 'ok', version: '1.1' });
    return true;
  }

  if (message.action === 'startSniper') {
    const { url, targetTime, profile } = message;
    chrome.alarms.clear('sniperTick');
    chrome.storage.local.set({
      sniperConfig: {
        url, targetTime, profile,
        status: 'waiting',
        message: `等待中，目標時間 ${targetTime}`
      }
    });
    scheduleSniper(url, targetTime, profile);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get('sniperConfig', (data) => {
      sendResponse(data.sniperConfig || { status: 'idle', message: '閒置中' });
    });
    return true;
  }

  if (message.action === 'stop') {
    chrome.alarms.clear('sniperTick');
    chrome.storage.local.set({ sniperConfig: { status: 'idle', message: '已取消' } });
    sendResponse({ success: true });
    return true;
  }
});

// ── 內部訊息（來自 popup 或 content script）──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    chrome.storage.local.get('sniperConfig', (data) => {
      sendResponse(data.sniperConfig || { status: 'idle', message: '閒置中' });
    });
    return true;
  }

  if (message.action === 'fillDone') {
    // content.js 通知填寫完成
    chrome.storage.local.get('sniperConfig', (data) => {
      const cfg = data.sniperConfig || {};
      chrome.storage.local.set({
        sniperConfig: { ...cfg, status: 'done', message: '✅ 填寫完成！請確認後送出。' }
      });
    });
    return true;
  }

  if (message.action === 'fillError') {
    chrome.storage.local.get('sniperConfig', (data) => {
      const cfg = data.sniperConfig || {};
      chrome.storage.local.set({
        sniperConfig: { ...cfg, status: 'error', message: `❌ 填寫錯誤：${message.detail || '未知錯誤'}` }
      });
    });
    return true;
  }
});

// ── 排程核心 ──
function scheduleSniper(url, targetTime, profile) {
  const now = new Date();
  const [h, m, s] = targetTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, s, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // 隔天同一時間

  const delayMs = target - now;
  console.log(`[Sniper] 目標時間 ${targetTime}，距離觸發還有 ${(delayMs/1000).toFixed(1)} 秒`);

  // chrome.alarms 最小精度約 1 分鐘，用來保持 Service Worker 存活
  // 實際精準觸發靠 storage 輪詢 + onAlarm 雙保險
  const delayMin = delayMs / 60000;
  chrome.alarms.create('sniperTick', {
    delayInMinutes: Math.max(delayMin, 0.016) // 最小約 1 秒
  });

  // 同時存下目標時間戳，讓 alarm 回調可以自己判斷是否到時
  chrome.storage.local.get('sniperConfig', (data) => {
    const cfg = data.sniperConfig || {};
    chrome.storage.local.set({
      sniperConfig: {
        ...cfg,
        targetTimestamp: target.getTime()
      }
    });
  });
}

// ── Alarm 觸發 ──
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'sniperTick') return;

  chrome.storage.local.get('sniperConfig', (data) => {
    const cfg = data.sniperConfig;
    if (!cfg || cfg.status !== 'waiting') return;

    const now = Date.now();
    const target = cfg.targetTimestamp || 0;

    if (now >= target - 2000) {
      // 到時（允許 2 秒提前，由 openAndFill 內再精準等待）
      openAndFill(cfg.url, cfg.targetTimestamp, cfg.profile);
    } else {
      // 還沒到，重新排一個 alarm
      const remaining = target - now;
      chrome.alarms.create('sniperTick', {
        delayInMinutes: Math.max(remaining / 60000, 0.016)
      });
    }
  });
});

// ── 開啟頁面並填表 ──
async function openAndFill(url, targetTimestamp, profile) {
  // 精準等待到目標時間
  const waitMs = targetTimestamp - Date.now();
  if (waitMs > 0) {
    await new Promise(r => setTimeout(r, waitMs));
  }

  setConfig({ status: 'opening', message: '開啟表單中...' });

  chrome.tabs.create({ url, active: true }, (tab) => {
    if (!tab) {
      setConfig({ status: 'error', message: '❌ 無法開啟分頁' });
      return;
    }

    let attempts = 0;
    const checkReady = setInterval(() => {
      attempts++;
      if (attempts > 100) { // 30 秒 timeout
        clearInterval(checkReady);
        setConfig({ status: 'error', message: '❌ 頁面載入逾時' });
        return;
      }

      chrome.tabs.get(tab.id, (t) => {
        if (chrome.runtime.lastError || !t) {
          clearInterval(checkReady);
          return;
        }
        if (t.status === 'complete') {
          clearInterval(checkReady);
          setConfig({ status: 'filling', message: '填寫中...' });
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: fillForm,
            args: [profile]
          }).catch((err) => {
            setConfig({ status: 'error', message: `❌ 注入腳本失敗：${err.message}` });
          });
        }
      });
    }, 300);
  });
}

// 便利函式：只更新狀態，保留其他 config 欄位
function setConfig(patch) {
  chrome.storage.local.get('sniperConfig', (data) => {
    const cfg = data.sniperConfig || {};
    chrome.storage.local.set({ sniperConfig: { ...cfg, ...patch } });
  });
}

// ── 注入到 Google Forms 的填表函式 ──
function fillForm(profile) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function setVal(el, v) {
    if (!el || !v) return;
    // 用 React/Angular 相容的方式觸發 input 事件
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, v);
    else el.value = v;
    ['input', 'change', 'blur'].forEach(type =>
      el.dispatchEvent(new Event(type, { bubbles: true }))
    );
  }

  async function run() {
    try {
      await sleep(1000); // 等 React hydration

      // ── 嘗試取消「記錄電子郵件地址」勾選（若表單要求）──
      try {
        const emailCheckboxes = document.querySelectorAll('[role="checkbox"]');
        emailCheckboxes.forEach(cb => {
          const label = cb.closest('label')?.innerText || cb.getAttribute('aria-label') || '';
          if (/記錄|email.*address/i.test(label) && cb.getAttribute('aria-checked') === 'true') {
            cb.click();
          }
        });
      } catch (e) {}

      // ── 填寫文字欄位 ──
      // Google Forms 的題目容器：.Qr7Oae（新版）或 [role="listitem"]（舊版）
      const containers = document.querySelectorAll('.Qr7Oae, [role="listitem"]');

      containers.forEach(q => {
        const titleEl = q.querySelector('[role="heading"], .M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle');
        const title = (titleEl?.innerText || q.innerText || '').toLowerCase();
        const inp = q.querySelector('input[type="text"], input[type="email"], input[type="tel"], textarea');
        if (!inp) return;

        let val = '';
        if (/郵件|email|信箱|電子/.test(title))           val = profile.email;
        else if (/暱稱|nickname|代號|稱呼|id\b/.test(title)) val = profile.nick;
        else if (/姓名|名字|名稱|真實|填寫人|your name/.test(title)) val = profile.name;
        else if (/手機|電話|phone|mobile|號碼|聯絡/.test(title)) val = profile.phone;

        if (val) setVal(inp, val);
      });

      await sleep(300);

      // ── 選擇指名選項（radio / checkbox）──
      if (profile.key && profile.key.trim()) {
        const key = profile.key.trim();
        // 新版 Forms 用 .lLfZXe 或 [data-value]，也查 aria-label 及文字
        const allOptions = document.querySelectorAll(
          '[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledControl'
        );
        let matched = false;
        for (const opt of allOptions) {
          const label = opt.getAttribute('aria-label') || opt.innerText || '';
          if (label.includes(key)) {
            opt.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(150);
            opt.click();
            matched = true;
            break;
          }
        }
        // 二次嘗試：找 span/div 包含文字的 label
        if (!matched) {
          const spans = document.querySelectorAll('.ajBQCb, .snByac');
          for (const sp of spans) {
            if ((sp.innerText || '').includes(key)) {
              const clickable = sp.closest('[role="radio"], [role="checkbox"]') || sp;
              clickable.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(150);
              clickable.click();
              break;
            }
          }
        }
      }

      // 捲到底讓使用者看到送出按鈕
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      // 通知 background 完成
      chrome.runtime.sendMessage({ action: 'fillDone' });

    } catch (err) {
      chrome.runtime.sendMessage({ action: 'fillError', detail: err.message });
    }
  }

  run();
}
