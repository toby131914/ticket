# 📸 搶票助手 - 圖解安裝步驟

## 步驟 1：準備擴充功能檔案

```
你的電腦
└── 任意位置（例如 Downloads）
    └── sniper-extension/          ← 建立一個資料夾
        ├── manifest.json          ← 複製進來
        ├── background.js          ← 複製進來
        ├── content.js             ← 複製進來
        ├── popup.html             ← 複製進來
        └── icon.png               ← 複製進來
```

**記住這個資料夾的位置！** 下一步要用到。

---

## 步驟 2：打開 Chrome 擴充功能管理頁面

### 2.1 - 打開網址列，輸入：
```
chrome://extensions
```
按 **Enter**

你會看到：
```
┌─────────────────────────────────────────┐
│  Chrome 擴充功能                    🔍   │
│                                         │
│  ☐ 開發人員模式          ← 在這裡 (關) │
│                                         │
│  已安裝的擴充功能：                      │
│  (預設是空的，或有幾個預設擴充功能)      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 步驟 3：打開開發人員模式

### 3.1 - 右上角找到「開發人員模式」

點擊開關，從 ☐ 變成 ☑️

打開後，左上角會出現新按鈕：
```
┌──────────────────────────────────────────┐
│ ⊞ 載入未封裝項目                         │
│ ⊞ 打包擴充功能                           │
│ ⊞ 更新                                   │
│                                          │
│ Chrome 擴充功能        [開發人員模式 ☑️] │
└──────────────────────────────────────────┘
```

---

## 步驟 4：載入你的擴充功能資料夾

### 4.1 - 點擊「載入未封裝項目」按鈕

跳出一個檔案選擇對話框。

### 4.2 - 找到並選擇 `sniper-extension/` 資料夾

例如你把資料夾放在桌面：
```
桌面
└── sniper-extension/  ← 選這個資料夾
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── popup.html
    └── icon.png
```

點「選取資料夾」（或「Open」）

---

## 步驟 5：查看安裝成功

安裝完成後，`chrome://extensions` 頁面會顯示：

```
┌──────────────────────────────────────────────────────┐
│ 搶票助手                                             │
│ ────────────────────────────────────────────────────│
│ Google Forms 自動搶票填寫工具                        │
│                                                      │
│ ID: ifekiaajkiaejdkafkdkdnakfkajkda  ← 複製這個！  │
│ 版本: 1.1                                            │
│ 由本機的擴充功能載入                                 │
│                                                      │
│ [移除]  [修復]  [設定] [收合]                        │
└──────────────────────────────────────────────────────┘
```

**按 ID 旁邊的複製按鈕（或手動選中複製）**，記下這個 32 碼字串。

---

## 步驟 6：填入 index.html 中的 EXT_ID

### 6.1 - 打開 `github-pages/index.html` 文件

用文字編輯器（例如 VS Code、Notepad++ 或記事本）打開。

### 6.2 - 找到這一行（大約第 158 行）：

```javascript
const EXT_ID = undefined;
```

### 6.3 - 改成你複製的 ID：

例如 ID 是 `ifekiaajkiaejdkafkdkdnakfkajkda`，改成：

```javascript
const EXT_ID = "ifekiaajkiaejdkafkdkdnakfkajkda";
```

### 6.4 - **儲存檔案** (Ctrl+S)

---

## 步驟 7：測試連線（本機）

### 7.1 - 啟動本機伺服器

打開命令列/終端機，進入 `github-pages/` 資料夾所在目錄，執行：

**Windows PowerShell：**
```powershell
python server.py
```

**Mac/Linux Terminal：**
```bash
python3 server.py
```

看到：
```
🌐 訪問網址：http://localhost:8000
✅ 已自動開啟瀏覽器
```

### 7.2 - 打開 Chrome，訪問：
```
http://localhost:8000
```

應該看到：
```
┌─────────────────────────────────────────┐
│ ✅ 搶票助手已連線 (v1.1)                │
│                                         │
│ 搶票系統                                 │
│ 自動填寫 · 精準計時 · 秒速搶票           │
│                                         │
│ 01 表單設定                              │
│ 表單網址：[         ]                    │
│ 搶票時間：[20] : [00] : [00]             │
│ ...                                      │
└─────────────────────────────────────────┘
```

**看到綠色的 ✅ 提示就表示成功了！**

---

## 步驟 8：開始使用搶票系統

現在你可以：

```
1️⃣  填入 Google Forms 的完整網址
2️⃣  設定搶票時間（時:分:秒）
3️⃣  輸入個人資訊（姓名、Email、電話等）
4️⃣  點「🎯 啟動搶票」
5️⃣  等待倒數計時到零
6️⃣  自動開啟 Forms 並填寫
7️⃣  檢查內容後手動點「送出」
```

---

## 🔍 如果沒看到 ✅ 綠色提示？

### 檢查項目：

1. **確認擴充功能已安裝**
   ```
   chrome://extensions → 有「搶票助手」嗎？
   ```

2. **確認 EXT_ID 有填**
   ```
   在 index.html 裡搜尋 const EXT_ID
   應該看到："ifekiaajkiaejdkafkdkdnakfkajkda" 之類的值
   ```

3. **硬重整網頁**
   ```
   按 Ctrl+Shift+R (Windows/Linux)
   或 Cmd+Shift+R (Mac)
   ```

4. **打開 DevTools 看 Console**
   ```
   F12 → Console 分頁
   有紅色錯誤訊息嗎？
   ```

5. **檢查 EXT_ID 是否複製正確**
   ```
   chrome://extensions → 找「搶票助手」
   複製 ID → 貼到 index.html
   ```

---

## ✨ 進階：上傳到 GitHub Pages

如果想要永久連結，不需要本機伺服器：

### A. 建立 GitHub Repository

1. 登入 [GitHub.com](https://github.com)
2. 建立新 repo，名稱例如 `sniper-ticket`
3. Clone 到本機

### B. 上傳網頁檔案

```
你的 repo
├── index.html          ← 複製進來
├── extension_install.html
├── README.md
└── .gitignore
```

### C. 啟用 GitHub Pages

1. 進入 repo 設定：Settings → Pages
2. Branch 選擇 **main**（或 master）
3. 點 **Save**

### D. 訪問你的 GitHub Pages

等 1-2 分鐘，訪問：
```
https://你的GitHub帳號.github.io/你的repo名稱/
```

應該看到同樣的界面和 ✅ 提示。

---

## 📋 最終檢查清單

在開始搶票前，確認：

- [ ] `chrome://extensions` 看到「搶票助手」
- [ ] 複製了 32 碼的 ID
- [ ] 在 `index.html` 填入了 EXT_ID
- [ ] 重新整理網頁後看到 ✅ 綠色提示
- [ ] 可以輸入表單網址和時間
- [ ] 「🎯 啟動搶票」按鈕可以點擊

全部打勾？🎉 恭喜，你已準備就緒！

---

## 🆘 還是有問題？

**常見原因及解決**：

| 症狀 | 原因 | 解決 |
|------|------|------|
| 看不到 ✅ 提示 | EXT_ID 錯誤或未填 | 複製正確的 ID 並更新 index.html |
| 「開發人員模式」紅條 | 正常警告 | 可忽略，發布到 Web Store 可消除 |
| DevTools 看到紅色錯誤 | 某個檔案有語法錯誤 | 檢查 manifest.json / background.js |
| 網頁打不開 | 伺服器沒啟動 | 執行 `python server.py` |
| 點「啟動搶票」沒反應 | 未連線到擴充功能 | 檢查 EXT_ID，重新整理 |

有問題時，**開啟 DevTools → Console** 看錯誤訊息，通常能找到原因。

---

**祝你搶票成功！** 🎫🎉

