# EG² Center Trainer

Skewb EG2 中心排列辨識練習器。這份版本是純靜態網站，不需要安裝 npm，也不需要後端。

## 功能

- Full 16：H、Z、U1/U2、TS1/TS2、ZC1/ZC2、O1/O2、X1/X2、W1/W2、S1/S2
- Basic 9：合併鏡像方向，只回答 H / Z / U / TS / ZC / O / X / W / S
- 24 種合法 whole-cube 配色方向，適合 color neutral recognition
- 可關閉角塊，只看中心
- 首答正確率、連續答對、本題反應時間
- 鍵盤快捷鍵與手機版介面
- 設定與統計儲存在瀏覽器 localStorage

## 放到 GitHub Pages

1. 建立一個 GitHub repository。
2. 把 `index.html`、`styles.css`、`app.js` 放在 repository 根目錄。
3. GitHub repository 進入 **Settings → Pages**。
4. Source 選 **Deploy from a branch**，Branch 選 `main`、folder 選 `/ (root)`。
5. 儲存後等待 GitHub Pages 產生網址即可。

本機也可以直接開 `index.html` 使用。

## Case data

EG2 Ori 使用 16 個中心狀態（ID 132–147），中心順序為 `[U, F, R, B, L]`；顯示的角塊在這 16 個狀態中固定一致。這個 trainer 專門把 corner state 固定，練 center permutation recognition。

Reference: [Skewb NS2 Trainer / Alg-Trainers](https://github.com/mihlefeld/Alg-Trainers/tree/master/Skewb-NS2-Trainer)
