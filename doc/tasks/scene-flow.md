# Scene Flow 模組任務

## 目標

根據 Game State 管理首頁、接觸士兵、對話、跑酷與結束畫面的流程。

## 最小可執行任務

- [x] 建立狀態對應的場景啟用邏輯。
- [x] 在 `title` 狀態接收 `start` 後切換到 `approach`。
- [x] 在 `approach` 狀態接收 `contactSoldier` 後切換到 `dialogue`。
- [x] 在 `dialogue` 狀態接收 `dialogueComplete` 後切換到 `runner`。
- [x] 在 `runner` 狀態接收 `hitSoldier` 後切換到 `gameOver`。
- [x] 在 `gameOver` 狀態接收 `restart` 後切換到 `approach`。
- [x] 將玩家動作只傳給目前狀態允許的場景。
- [x] 切換場景時呼叫對應場景的初始化或重設方法。
- [x] 切換場景時通知 UI/HUD 顯示對應畫面。

## 完成標準

- [x] 玩家能按首頁 → 接觸士兵 → 對話 → 跑酷 → 結束流程遊玩。
- [x] 不在錯誤狀態處理無效輸入。
- [x] Scene Flow 不直接處理碰撞或分數計算。

