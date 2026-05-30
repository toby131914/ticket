chrome.runtime.sendMessage({ action: 'getStatus' }, (res) => {
  const el = document.getElementById('status');
  if (chrome.runtime.lastError || !res) {
    el.textContent = '目前沒有狀態。';
    return;
  }
  el.textContent = res.message || res.status || '已待命';
});
