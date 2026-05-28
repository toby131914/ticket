# 📋 搶票助手 - 快速安裝檢查清單

## 🎯 30 秒快速版

### 第一步：準備檔案（2 分鐘）
```
你的資料夾/
├── manifest.json ✓
├── background.js ✓
├── content.js ✓
├── popup.html ✓
└── icon.png ✓
```

### 第二步：在 Chrome 安裝（3 分鐘）
```
1. 打開 chrome://extensions
2. 右上角「開發人員模式」打開 ✓
3. 點「載入未封裝項目」✓
4. 選上面那個資料夾 ✓
5. 複製顯示的 ID（32 碼）✓
```

### 第三步：編輯網頁（1 分鐘）
找 `index.html` 這一行：
```javascript
const EXT_ID = undefined;
```

改成：
```javascript
const EXT_ID = "你複製的ID";
```

### 第四步：測試（1 分鐘）
打開 `index.html` → 看到 ✅ 綠色提示 → 完成！

---

## ✅ 安裝成功的跡象

✓ `chrome://extensions` 看到「搶票助手」  
✓ 有一個 ID（32 碼英文字母）  
✓ 打開 `index.html` 顯示「✅ 搶票助手已連線 (v1.1)」  
✓ 可以輸入表單網址和時間  
✓ 「🎯 啟動搶票」按鈕可點擊  

---

## ❌ 常見錯誤及修正

| 錯誤信息 | 原因 | 修正 |
|---------|------|------|
| 「請先安裝擴充套件」| EXT_ID 未填或填錯 | 檢查 index.html 的 EXT_ID，複製正確的 ID |
| 「無法連線」| 擴充功能未安裝 | 確認 chrome://extensions 有「搶票助手」|
| 「開發人員模式」紅字 | 正常警告 | 發布到 Web Store 可消除（非必要）|
| 點啟動沒反應 | 時間格式/網址錯誤 | 確認網址是 https://docs.google.com/forms/d/... |
| 自動填寫失敗 | Forms 結構變更 | 檢查題目是否含「姓名」等關鍵字 |

---

## 🧪 測試步驟

### 本機測試（推薦）
```bash
# 1. 進入 index.html 所在的目錄
cd github-pages

# 2. 啟動簡單伺服器
python3 -m http.server 8000

# 3. 打開 Chrome
http://localhost:8000
```

### GitHub Pages 測試
```
1. Push 到 GitHub
2. Settings → Pages → Branch: main → Save
3. 訪問 https://你的帳號.github.io/repo/
```

---

## 🔍 除錯技巧

### 查看 Console 訊息
1. 打開 `index.html`
2. 按 F12 開啟開發者工具
3. 點「Console」分頁
4. 點「啟動搶票」看有無紅色錯誤

### 查看擴充功能 Log
1. 打開 `chrome://extensions`
2. 找「搶票助手」→ 點「Service Worker」
3. 看 Console 裡有無 `[Sniper]` 開頭的訊息

### 查看儲存狀態
1. DevTools → Application → Storage → Local Storage
2. 應該看到 `sniperConfig` 欄位

---

## 📱 各種裝置的安裝方式

### Windows / Mac / Linux
直接用上面的方法，完全相同。

### Chromebook
完全相同，因為也是 Chrome 瀏覽器。

### 手機（Android/iOS）
**不支持**，Chrome 擴充功能只在桌面版 Chrome 運作。

---

## 🎓 理解運作原理

```
你的網頁 (index.html)
    ↓ 發送訊息（sendMessage）
    ↓
Chrome 擴充功能（background.js）
    ↓ 等待時間到
    ↓ 開啟 Google Forms 頁面
    ↓ 注入 fillForm 函式
    ↓
Google Forms 頁面
    ↓ 自動填寫表格
    ↓ 通知 background 完成
    ↓
你的網頁
    ↓ 顯示「✅ 填寫完成」
```

---

## 🚀 下一步

1. ✅ 安裝完成後，在 `index.html` 填入一個 Google Forms URL 測試
2. ✅ 設定搶票時間為 10 秒後
3. ✅ 點「啟動搶票」，觀察有無自動開啟和填寫
4. ✅ 手動送出表單測試完整流程

---

## 📞 還有問題？

**檢查清單**：
- [ ] manifest.json 檔案存在且內容正確
- [ ] 擴充功能在 chrome://extensions 可見
- [ ] 複製的 ID 確實填入 index.html
- [ ] 重新整理網頁（Ctrl+Shift+R）
- [ ] 開啟 DevTools 看 Console 有無紅色錯誤

如果都檢查過還是有問題，看 DevTools 的錯誤訊息，通常能找到原因。

祝你搶票成功！🎉

