# 搶票系統

Google Forms 自動搶票工具，由 Chrome 擴充套件 + GitHub Pages 組成。

## 專案結構

```
sniper-extension/
├── extension/          ← Chrome 擴充套件（每位使用者安裝）
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── popup.html
└── github-pages/       ← 上傳到 GitHub Pages 的網頁
    ├── index.html          （主要操作頁面）
    └── extension_install.html（安裝說明）
```

## 部署步驟

### 1. 上傳到 GitHub Pages

1. 建立 GitHub repository
2. 將 `github-pages/` 裡的所有檔案上傳到 repo 根目錄
3. Settings → Pages → Branch: main → Save
4. 網址會是 `https://你的帳號.github.io/repo名稱/`

### 2. 安裝 Chrome 擴充套件

1. 打開 `chrome://extensions`
2. 開啟右上角「開發人員模式」
3. 點「載入未封裝項目」→ 選 `extension/` 資料夾
4. 記下擴充套件 ID

### 3. 填入擴充套件 ID

打開 `github-pages/index.html`，找到這行：

```js
const EXT_ID = undefined;
```

改成：

```js
const EXT_ID = "你的擴充套件ID";
```

再 push 到 GitHub。

## 使用流程

1. 開啟 GitHub Pages 網址
2. 填入表單網址、搶票時間、個人資料
3. 點「啟動搶票」
4. 時間到自動開啟 Google Forms 並填寫
5. 確認填寫內容後手動送出

## 注意事項

- 擴充套件需每台電腦各自安裝
- 填完表單後仍需手動按送出（避免誤送）
- Chrome 需保持開啟狀態
