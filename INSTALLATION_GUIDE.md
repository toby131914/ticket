# 🎯 搶票助手 - 完整安裝指南

## 第一步：準備擴充功能文件

### 方法 A：直接從本地資料夾安裝（最快，推薦）

1. **下載或複製以下文件到一個資料夾** `sniper-extension/`：
   ```
   sniper-extension/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── popup.html
   └── icon.png
   ```

2. **確保檔案內容完全正確**：
   - `manifest.json` — 設定檔
   - `background.js` — 核心邏輯（大約 280 行）
   - `content.js` — 輔助橋接
   - `popup.html` — 小彈窗
   - `icon.png` — 圖示

---

## 第二步：在 Chrome 中載入擴充功能

### 步驟 1：打開 Chrome 擴充功能管理頁面

在 Chrome 網址列輸入：
```
chrome://extensions
```
按 **Enter** 進入。

### 步驟 2：開啟「開發人員模式」

在右上角找到 **「開發人員模式」** 開關，點擊打開。

![示意圖]
- 右上方應該出現三個新按鈕：「載入未封裝項目」、「打包擴充功能」、「更新」

### 步驟 3：載入擴充功能資料夾

1. 點擊左上角 **「載入未封裝項目」** 按鈕
2. 在檔案瀏覽器中找到你的 `sniper-extension/` 資料夾
3. 選中後點 **「選取資料夾」**

### 步驟 4：複製擴充套件 ID

安裝成功後，頁面會顯示「搶票助手」擴充功能。

找到這一行：
```
ID: abcdefghijklmnopabcdefghijklmnop
```

**複製這個 32 碼的英文字母 ID**（下面詳細說明如何使用）。

---

## 第三步：設定網頁上的 EXT_ID

這是 **最關鍵的一步**，否則網頁無法與擴充功能通訊！

### 編輯 index.html

打開 `github-pages/index.html` 檔案，找到這一行（大約在 line 158）：

```javascript
const EXT_ID = undefined;
```

改成：

```javascript
const EXT_ID = "abcdefghijklmnopabcdefghijklmnop";  // 改成你複製的 ID
```

例如你複製的 ID 是 `ifekiaajkiaejdkafkdkdnakfkajkda`，就寫：

```javascript
const EXT_ID = "ifekiaajkiaejdkafkdkdnakfkajkda";
```

### 儲存檔案

- 若在 GitHub Pages：直接 push 到 repo
- 若在本機測試：就儲存即可

---

## 第四步：測試連線

### 測試 A：本機測試（無網路限制）

1. 在本機啟動一個簡單的 HTTP 伺服器：
   ```bash
   # 在 index.html 所在的目錄執行
   python3 -m http.server 8000
   ```

2. 打開 Chrome，輸入：
   ```
   http://localhost:8000
   ```

3. 應該看到「✅ 搶票助手已連線 (v1.1)」的綠色提示

### 測試 B：上傳到 GitHub Pages

1. 將 `github-pages/` 內的所有檔案推送到 GitHub repo
2. 在 repo 設定中啟用 GitHub Pages（Settings → Pages → Branch: main）
3. 訪問你的 GitHub Pages URL：
   ```
   https://你的帳號.github.io/你的repo名稱/
   ```
4. 應該看到連線成功的綠色提示

---

## 第五步：使用搶票系統

1. **進入網頁**：訪問安裝好的 `index.html`
2. **填入表單網址**：貼上 Google Forms 的完整 URL
3. **設定搶票時間**：例如 14:30:00
4. **填寫個人資訊**：姓名、email 等（系統會自動填入）
5. **點擊「🎯 啟動搶票」**：開始倒數
6. **時間到會自動**：
   - 開啟 Google Forms 分頁
   - 自動填寫你設定的資訊
   - 捲到底部顯示「送出」按鈕
7. **手動確認送出**：檢查內容無誤後，點 Google Forms 的「送出」按鈕

---

## 🔧 常見問題排除

### ❌ 問題：看到「請先安裝擴充套件」的警告

**原因**：
- 擴充功能未正確安裝
- EXT_ID 未填入或填錯

**解決**：
1. 確認 `chrome://extensions` 看到「搶票助手」
2. 複製正確的 ID
3. 更新 `index.html` 中的 `EXT_ID`
4. 重新整理網頁（Ctrl+Shift+R 硬重整）

---

### ❌ 問題：看到「開發人員模式」警告（紅色橫幅）

**原因**：開啟了開發人員模式的擴充功能，Chrome 會警告

**解決**：
1. 這是正常的（未發布到 Web Store 時會出現）
2. 發布到 Chrome Web Store 可消除此警告
3. 若要無警告，需向 Google 提交發布審核

---

### ❌ 問題：點「啟動搶票」後沒反應

**原因**：
- 表單網址格式錯誤
- 時間已過期（若搶票時間早於現在時間）

**解決**：
1. 確認網址是完整的 `https://docs.google.com/forms/d/...`
2. 確認時間設定在未來（會自動延至隔天同一時間）
3. 開啟 Chrome DevTools（F12）看 Console 有無錯誤

---

### ❌ 問題：自動開啟 Forms 後沒自動填寫

**原因**：
- Google Forms 結構變更（Google 常更新）
- 題目文字不符合辨識規則
- 時間延遲導致 React 未完全載入

**解決**：
1. 等待 1-2 秒，Google Forms 通常有載入延遲
2. 檢查題目標題是否包含「郵件」、「姓名」、「電話」等關鍵字
3. 若題目文字特殊，可手動修改 `background.js` 中的正規表達式

---

## 📋 檔案清單

確認你有以下文件：

| 文件 | 位置 | 用途 |
|------|------|------|
| `manifest.json` | `extension/` | 擴充功能設定 |
| `background.js` | `extension/` | 核心邏輯（填表、計時）|
| `content.js` | `extension/` | 輔助橋接 |
| `popup.html` | `extension/` | 擴充功能小彈窗 |
| `icon.png` | `extension/` | 擴充功能圖示 |
| `index.html` | `github-pages/` | 主操作網頁（需填 EXT_ID）|
| `extension_install.html` | `github-pages/` | 安裝說明網頁 |

---

## 🚀 進階：發布到 Chrome Web Store（可選）

若想讓多人使用且無「開發人員模式」警告：

1. 註冊 Google Play Developer 帳號（$5 一次性費用）
2. 將 `extension/` 資料夾打包為 `.zip`
3. 上傳到 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. 填寫描述、截圖、隱私權政策
5. 提交審核（通常 1-3 天）
6. 通過後取得永久 ID，就不用每台電腦都設定了

---

## ✨ 最後檢查清單

- [ ] 擴充功能已在 `chrome://extensions` 看到
- [ ] 已複製 32 碼的擴充套件 ID
- [ ] 已在 `index.html` 填入 `EXT_ID`
- [ ] 訪問網頁時看到 ✅ 綠色提示
- [ ] 可以填入表單網址和時間
- [ ] 「啟動搶票」按鈕可點擊

完成以上步驟後，你就可以開始使用了！🎉

