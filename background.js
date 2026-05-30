// background.js - Chrome extension service worker

const VERSION = '1.2';
const HIGH_PRECISION_CHECK_MS = 10;
const EARLY_OPEN_MS = 1500;
const RELOAD_INTERVAL_MS = 250;
const MAX_FORM_WAIT_MS = 30000;

let precisionTimer = null;

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;
});

function handleMessage(message, sendResponse) {
  if (message.action === 'ping') {
    sendResponse({ status: 'ok', version: VERSION });
    return;
  }

  if (message.action === 'startSniper') {
    const { url, targetTime, profile } = message;
    const targetTimestamp = getNextTargetTimestamp(targetTime);

    stopTimers();
    chrome.alarms.clear('sniperWake');
    setConfig({
      url,
      targetTime,
      targetTimestamp,
      profile,
      status: 'waiting',
      message: `等待開放時間 ${targetTime}`
    });

    scheduleWake(targetTimestamp);
    sendResponse({ success: true, targetTimestamp });
    return;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get('sniperConfig', (data) => {
      sendResponse(data.sniperConfig || { status: 'idle', message: '尚未啟動' });
    });
    return;
  }

  if (message.action === 'stop') {
    stopTimers();
    chrome.alarms.clear('sniperWake');
    setConfig({ status: 'idle', message: '已停止' });
    sendResponse({ success: true });
    return;
  }

  if (message.action === 'fillDone') {
    setConfig({ status: 'done', message: '已填入資料，請確認並送出' });
    return;
  }

  if (message.action === 'fillError') {
    setConfig({ status: 'error', message: `填表失敗：${message.detail || '未知錯誤'}` });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'sniperWake') return;

  chrome.storage.local.get('sniperConfig', (data) => {
    const cfg = data.sniperConfig;
    if (!cfg || cfg.status !== 'waiting') return;
    startPrecisionOpen(cfg);
  });
});

function getNextTargetTimestamp(targetTime) {
  const now = new Date();
  const [h, m, s] = targetTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, s, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime();
}

function scheduleWake(targetTimestamp) {
  const wakeAt = targetTimestamp - EARLY_OPEN_MS - 5000;
  const delayMs = Math.max(0, wakeAt - Date.now());

  // chrome.alarms is coarse but reliable for long waits; the last few seconds
  // switch to a 10 ms timer in startPrecisionOpen().
  chrome.alarms.create('sniperWake', {
    delayInMinutes: Math.max(delayMs / 60000, 0.016)
  });
}

function startPrecisionOpen(cfg) {
  stopTimers();

  setConfig({
    status: 'waiting',
    message: `高頻校時中，每 ${HIGH_PRECISION_CHECK_MS}ms 確認一次`
  });

  precisionTimer = setInterval(() => {
    const now = Date.now();
    if (now >= cfg.targetTimestamp - EARLY_OPEN_MS) {
      stopTimers();
      openAndWatchForm(cfg);
    }
  }, HIGH_PRECISION_CHECK_MS);
}

function stopTimers() {
  if (precisionTimer) {
    clearInterval(precisionTimer);
    precisionTimer = null;
  }
}

function openAndWatchForm(cfg) {
  setConfig({ status: 'opening', message: '正在開啟 Google 表單' });

  chrome.tabs.create({ url: cfg.url, active: true }, (tab) => {
    if (!tab?.id) {
      setConfig({ status: 'error', message: '無法開啟表單分頁' });
      return;
    }

    watchFormUntilOpen(tab.id, cfg);
  });
}

function watchFormUntilOpen(tabId, cfg) {
  const startedAt = Date.now();
  let lastReloadAt = 0;
  let filling = false;

  const watcher = setInterval(() => {
    if (filling) return;

    if (Date.now() - startedAt > MAX_FORM_WAIT_MS) {
      clearInterval(watcher);
      setConfig({ status: 'error', message: '等待表單開啟逾時' });
      return;
    }

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        clearInterval(watcher);
        setConfig({ status: 'error', message: '表單分頁已關閉' });
        return;
      }

      if (tab.status !== 'complete') return;

      checkFormOpen(tabId).then((result) => {
        if (result.open) {
          filling = true;
          clearInterval(watcher);
          setConfig({ status: 'filling', message: '表單已開啟，正在填入資料' });
          injectFillForm(tabId, cfg.profile);
          return;
        }

        // DOM checks run every 10 ms, but reloads are capped to avoid hammering
        // Google and to keep Chrome from throttling the extension.
        if (Date.now() >= cfg.targetTimestamp && Date.now() - lastReloadAt >= RELOAD_INTERVAL_MS) {
          lastReloadAt = Date.now();
          chrome.tabs.reload(tabId, { bypassCache: true });
        }
      }).catch(() => {});
    });
  }, HIGH_PRECISION_CHECK_MS);
}

async function checkFormOpen(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: detectOpenGoogleForm
  });
  return result?.result || { open: false };
}

function detectOpenGoogleForm() {
  const bodyText = document.body?.innerText || '';
  const hasQuestion =
    !!document.querySelector('.Qr7Oae, [role="listitem"], input[type="text"], textarea, [role="radio"], [role="checkbox"]');
  const hasSubmit =
    Array.from(document.querySelectorAll('[role="button"], button')).some((el) =>
      /submit|送出|提交/i.test(el.innerText || el.getAttribute('aria-label') || '')
    );
  const isClosed =
    /no longer accepting responses|not accepting responses|已不接受回覆|停止接受回應|表單已關閉/i.test(bodyText);

  return {
    open: (hasQuestion || hasSubmit) && !isClosed,
    hasQuestion,
    hasSubmit,
    isClosed
  };
}

function injectFillForm(tabId, profile) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: fillForm,
    args: [profile]
  }).catch((err) => {
    setConfig({ status: 'error', message: `注入填表腳本失敗：${err.message}` });
  });
}

function setConfig(patch) {
  chrome.storage.local.get('sniperConfig', (data) => {
    const cfg = data.sniperConfig || {};
    chrome.storage.local.set({ sniperConfig: { ...cfg, ...patch } });
  });
}

function fillForm(profile) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function setVal(el, value) {
    if (!el || !value) return;
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    ['input', 'change', 'blur'].forEach((type) => {
      el.dispatchEvent(new Event(type, { bubbles: true }));
    });
  }

  async function run() {
    try {
      await sleep(250);

      const containers = document.querySelectorAll('.Qr7Oae, [role="listitem"]');
      containers.forEach((question) => {
        const titleEl = question.querySelector('[role="heading"], .M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle');
        const title = (titleEl?.innerText || question.innerText || '').toLowerCase();
        const input = question.querySelector('input[type="text"], input[type="email"], input[type="tel"], textarea');
        if (!input) return;

        let value = '';
        if (/email|e-mail|信箱|電子郵件/.test(title)) value = profile.email;
        else if (/nickname|暱稱|id\b|帳號/.test(title)) value = profile.nick;
        else if (/name|姓名|名字/.test(title)) value = profile.name;
        else if (/phone|mobile|電話|手機/.test(title)) value = profile.phone;

        setVal(input, value);
      });

      if (profile.key?.trim()) {
        const key = profile.key.trim();
        const options = document.querySelectorAll('[role="radio"], [role="checkbox"], .docssharedWizToggleLabeledControl');
        for (const option of options) {
          const label = option.getAttribute('aria-label') || option.innerText || '';
          if (label.includes(key)) {
            option.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(40);
            option.click();
            break;
          }
        }
      }

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
      chrome.runtime.sendMessage({ action: 'fillDone' });
    } catch (err) {
      chrome.runtime.sendMessage({ action: 'fillError', detail: err.message });
    }
  }

  run();
}
