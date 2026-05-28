# GitHub Pages 部署方式

這個資料夾可以直接放到 GitHub repo，透過 GitHub Pages 產生公開網址供使用者開啟。

## 要上傳到 GitHub 的檔案

至少上傳這些檔案：

```text
index.html
extension_install.html
manifest.json
background.js
GITHUB_PAGES_DEPLOY.md
```

`index.html` 是給使用者開的控制頁；`manifest.json` 和 `background.js` 是給使用者下載後載入 Chrome 的擴充套件。

## 開啟 GitHub Pages

1. 建立一個 GitHub repository。
2. 把上述檔案放到 repo 根目錄並 push。
3. 到 repo 的 `Settings -> Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`，按 Save。
6. 等 GitHub 產生網址，例如：

```text
https://你的帳號.github.io/你的repo/
```

## 使用者使用流程

1. 使用者先下載 repo 內的 `manifest.json` 和 `background.js`。
2. 在 Chrome 開啟 `chrome://extensions`。
3. 打開「開發人員模式」。
4. 載入包含 `manifest.json` 和 `background.js` 的資料夾。
5. 複製 Chrome 顯示的擴充 ID。
6. 開啟 GitHub Pages 網址，把擴充 ID 貼到頁面上方並儲存。

也可以用網址直接帶入 ID：

```text
https://你的帳號.github.io/你的repo/?ext=擴充ID
```

## 重要限制

一般 GitHub Pages 網頁不能直接控制 Chrome 分頁，也不能注入 Google Forms。這就是為什麼使用者仍然需要安裝 Chrome 擴充套件。

目前 `manifest.json` 允許下列來源呼叫擴充套件：

```text
https://*.github.io/*
http://127.0.0.1/*
http://localhost/*
```

如果你改用自訂網域，必須把該網域加入 `manifest.json` 的 `externally_connectable.matches`。
