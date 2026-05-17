# Game App 模組任務

## 目標

建立遊戲入口，負責初始化、組裝模組、啟動主循環，並保持全域生命週期清楚。

## 最小可執行任務

- [x] 建立遊戲入口初始化流程。
- [x] 初始化 Game State、Input、Scene Flow、UI/HUD、Audio、Asset、Responsive Layout 模組。
- [x] 設定初始狀態為 `title`。
- [x] 啟動資產登記或載入流程。
- [x] 在資產準備完成後允許玩家開始遊戲。
- [x] 建立 `requestAnimationFrame` 主循環。
- [x] 在每一幀計算時間差，並交給 Scene Flow 更新目前場景。
- [x] 在頁面重新開始時重設本局資料，但不保存最高分。
- [x] 確認首頁可正常啟動，且瀏覽器 console 沒有初始化錯誤。

## 完成標準

- [x] 打開遊戲後能看到首頁狀態。
- [x] 遊戲主循環能正常運作。
- [x] Game App 不直接處理碰撞、計分或具體按鈕細節。

