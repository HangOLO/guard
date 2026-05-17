# Vibe Coding 起始 Prompt

你是本專案的主 Agent。請在無人工參與的情況下，完整實作、整合、測試並交付 `roman-guard-escape` 遊戲。

## 專案目標

實作一個純 `HTML/CSS/JS` 網頁遊戲，中文名為「逃離羅馬守衛：空墓之謎」。

遊戲主要讓初中學生透過互動體驗理解：

> 墳墓外有守衛，很難成功偷走屍體。

遊戲必須能在 iPad 橫向瀏覽器中清楚操作，桌面瀏覽器可作為次要支援。

## 需求來源與優先順序

開始前必須閱讀以下文件：

1. `doc/proposal.md`
2. `doc/high-level-design.md`
3. `doc/tasks/*.md`

需求優先順序如下：

1. `doc/proposal.md` 是最高優先需求來源。
2. `doc/high-level-design.md` 是架構與模組邊界來源。
3. `doc/tasks/*.md` 是每個模組的具體完成清單。

如果文件之間有衝突，以 `doc/proposal.md` 為準。整個實作過程不得要求人工澄清；遇到細節未明確時，選擇最小、保守、符合需求文件的做法，並在最後交付報告中記錄假設。

## 硬性限制

- 使用純 `HTML/CSS/JS`。
- 不加入後端服務。
- 不加入登入。
- 不加入資料庫。
- 不加入雲端排行榜。
- 不保存最高分。
- 不顯示最高分。
- 不顯示排行榜。
- 不顯示經文提示或章節引用。
- 不沿用既有 `RSSteal` 專案作為實作基礎。
- 使用者提供的 4 張圖片只能作為風格參考，不可作為正式素材依賴。
- 主要驗收目標是 iPad 橫向畫面。
- 不需要完整手機直向玩法；直向開啟時顯示旋轉提示即可。

## 主 Agent 職責

主 Agent 負責整體進度與整合，不應把整體責任交給子 Agent。

必須完成：

1. 閱讀所有需求、設計與任務文件。
2. 建立或確認專案檔案結構。
3. 定義模組間的事件、資料與 API 契約。
4. 生成子 Agent，讓每個子 Agent 實作一個模組並完成該模組測試。
5. 監控每個子 Agent 的進度與產出。
6. 整合所有模組。
7. 執行端到端測試。
8. 修正整合與測試中發現的問題。
9. 更新 `doc/tasks/*.md` 與 `doc/tasks/progress.md` 的完成狀態。
10. 輸出最後交付報告，列出完成內容、測試結果與任何保守假設。

## 建議檔案結構

若專案尚未存在實作檔案，請採用以下結構：

```text
index.html
src/
  main.js
  styles.css
  modules/
    game-state.js
    input.js
    scene-flow.js
    approach-scene.js
    dialogue.js
    runner.js
    collision-score.js
    ui-hud.js
    audio.js
    asset.js
    responsive-layout.js
assets/
  README.md
```

可使用 `type="module"` 載入 JavaScript 模組。不得引入需要建置流程的前端框架，除非專案已有明確設定。

正式素材可用本地 SVG、CSS、Canvas 或 Web Audio 生成，但必須透過 Asset 模組統一管理鍵名。不可依賴外部網路資源。

## 模組契約

### 遊戲狀態

必須支援以下狀態：

- `title`
- `approach`
- `dialogue`
- `runner`
- `gameOver`

狀態切換規則：

| 目前狀態 | 事件 | 下一狀態 |
| --- | --- | --- |
| `title` | `start` | `approach` |
| `approach` | `contactSoldier` | `dialogue` |
| `dialogue` | `dialogueComplete` | `runner` |
| `runner` | `hitSoldier` | `gameOver` |
| `gameOver` | `restart` | `approach` |

### 輸入動作

Input 模組只輸出抽象動作：

- `moveLeft`
- `moveRight`
- `jump`
- `duck`
- `start`
- `restart`
- `toggleSound`

Input 模組不得直接修改 Game State、場景資料、分數或 UI。

### 核心事件

- `contactSoldier`
- `dialogueComplete`
- `scoreChanged`
- `hitSoldier`

事件應由 Scene Flow 或明確的 callback/event bus 統一轉交，避免模組互相直接耦合。

## 子 Agent 分工

主 Agent 需要生成下列子 Agent。每個子 Agent 必須先閱讀對應任務文件，再實作、測試並回報。

每個子 Agent 必須遵守：

- 只修改自己負責的模組檔案與必要的測試文件。
- 不重寫其他 Agent 的模組。
- 若需要跨模組 API，先依主 Agent 定義的契約使用。
- 完成後回報：修改檔案、完成任務、測試方式、剩餘風險。

### 1. Game App 子 Agent

來源文件：`doc/tasks/game-app.md`

負責檔案：

- `index.html`
- `src/main.js`

任務重點：

- 建立遊戲入口。
- 初始化所有模組。
- 設定初始狀態為 `title`。
- 啟動資產登記流程。
- 建立 `requestAnimationFrame` 主循環。
- 每幀計算 delta time 並交給 Scene Flow。
- 確認首頁能正常啟動且 console 無初始化錯誤。

### 2. Game State 子 Agent

來源文件：`doc/tasks/game-state.md`

負責檔案：

- `src/modules/game-state.js`

任務重點：

- 管理目前狀態。
- 管理本局分數。
- 管理聲音開關。
- 管理重設本局資料。
- 禁止保存或顯示最高分。

### 3. Input 子 Agent

來源文件：`doc/tasks/input.md`

負責檔案：

- `src/modules/input.js`

任務重點：

- 綁定 iPad 觸控按鈕。
- 綁定桌面鍵盤。
- 輸出抽象動作。
- 支援左右移動按住與放開。
- 支援蹲下按住與放開。
- 防止開始與重新開始重複觸發。

### 4. Scene Flow 子 Agent

來源文件：`doc/tasks/scene-flow.md`

負責檔案：

- `src/modules/scene-flow.js`

任務重點：

- 管理 `title -> approach -> dialogue -> runner -> gameOver` 流程。
- 根據目前狀態轉交有效輸入。
- 切換場景時呼叫對應初始化或重設方法。
- 通知 UI/HUD 更新畫面。
- 不直接處理碰撞或分數。

### 5. Approach Scene 子 Agent

來源文件：`doc/tasks/approach-scene.md`

負責檔案：

- `src/modules/approach-scene.js`

任務重點：

- 實作婦女左右移動。
- 設定羅馬士兵位置。
- 限制不可上下移動。
- 建立接觸判定。
- 接觸士兵時只觸發一次 `contactSoldier`。

### 6. Dialogue 子 Agent

來源文件：`doc/tasks/dialogue.md`

負責檔案：

- `src/modules/dialogue.js`

任務重點：

- 使用以下固定對話：
  1. 羅馬士兵：「站住！墓前有重兵看守，不准靠近。」
  2. 婦女：「我只是來看墓，根本不可能偷走屍體。」
  3. 系統提示：「守衛逼近了，開始逃離挑戰！」
- 顯示目前句子。
- 逐句前進。
- 最後一句完成後觸發 `dialogueComplete`。
- 不顯示經文章節引用。

### 7. Runner 子 Agent

來源文件：`doc/tasks/runner.md`

負責檔案：

- `src/modules/runner.js`

任務重點：

- 實作跑酷初始化。
- 實作婦女地面、跳躍、蹲下狀態。
- 生成低位士兵與高舉長矛士兵。
- 士兵由右向左移動。
- 移除離開畫面的士兵。
- 前 15 秒保留學習空間。
- 每 15 秒提升速度或生成壓力。
- 每幀將婦女與士兵資料交給 Collision & Score。
- 不直接更新分數或顯示結束畫面。

### 8. Collision & Score 子 Agent

來源文件：`doc/tasks/collision-score.md`

負責檔案：

- `src/modules/collision-score.js`

任務重點：

- 判斷婦女與士兵碰撞。
- 低位士兵需要跳躍避開。
- 高舉長矛士兵需要蹲下避開。
- 每名士兵最多計分一次。
- 每越過一名士兵加 10 分。
- 分數改變時觸發 `scoreChanged`。
- 撞到士兵時觸發 `hitSoldier`。
- 不保存或顯示最高分。

### 9. UI/HUD 子 Agent

來源文件：`doc/tasks/ui-hud.md`

負責檔案：

- `src/modules/ui-hud.js`
- `src/styles.css`

任務重點：

- 建立首頁。
- 建立開始遊戲按鈕。
- 建立接觸士兵階段左右移動按鈕。
- 建立對話框。
- 建立跑酷 HUD。
- 顯示本局分數。
- 建立聲音開關。
- 跑酷階段左下角放蹲下按鈕。
- 跑酷階段右下角放跳躍按鈕。
- 建立結束畫面。
- 結束畫面只顯示本局分數、教學總結與重新開始按鈕。
- 禁止顯示最高分、排行榜、登入入口、經文提示或章節引用。

### 10. Audio 子 Agent

來源文件：`doc/tasks/audio.md`

負責檔案：

- `src/modules/audio.js`

任務重點：

- 管理背景音樂。
- 管理跳躍、蹲下、加分、撞到士兵音效。
- 實作玩家互動後聲音解鎖。
- 實作 `toggleSound`。
- 靜音時不播放背景音樂或音效。
- 聲音邏輯不可分散在其他模組。

可使用 Web Audio 生成音效與簡單背景音樂，避免外部依賴。

### 11. Asset 子 Agent

來源文件：`doc/tasks/asset.md`

負責檔案：

- `src/modules/asset.js`
- `assets/README.md`

任務重點：

- 建立 asset manifest。
- 定義婦女、低位士兵、高舉長矛士兵、墓口、石壁、跑酷背景、UI、聲音圖示、背景音樂、音效鍵名。
- 提供依鍵名取得資產的方法。
- 其他模組不得直接依賴實際檔案路徑。
- 明確記錄參考圖不作正式素材依賴。

### 12. Responsive Layout 子 Agent

來源文件：`doc/tasks/responsive-layout.md`

負責檔案：

- `src/modules/responsive-layout.js`
- `src/styles.css`

任務重點：

- 建立 iPad 橫向版面基準。
- 設定遊戲畫面比例與安全邊界。
- 設定首頁、接觸士兵、跑酷階段 UI 位置。
- 左下角蹲下、右下角跳躍。
- 按鈕尺寸適合手指觸控。
- HUD 不遮擋跑酷判斷區。
- 提供 Runner 可用的地面線與障礙生成位置。
- 直向開啟時顯示旋轉提示。

## 整合順序

主 Agent 應依下列順序整合：

1. 建立基本檔案結構與模組 API 契約。
2. 整合 Game State、Asset、Responsive Layout。
3. 整合 UI/HUD 與 Input。
4. 整合 Scene Flow。
5. 整合 Approach Scene。
6. 整合 Dialogue。
7. 整合 Runner。
8. 整合 Collision & Score。
9. 整合 Audio。
10. 進行端到端測試與修正。
11. 更新任務 checklist。

## 遊戲體驗要求

### 首頁

- 顯示墓口背景、多名羅馬士兵、婦女角色與「開始遊戲」按鈕。
- 畫面要清楚傳達墓口被羅馬士兵看守。

### 接觸士兵階段

- 玩家使用左右按鈕控制婦女。
- 婦女只能左右移動。
- 接觸士兵後進入對話。

### 對話階段

- 顯示 2-3 句短對話。
- 對話需快速傳達守衛嚴密、不能靠近墓口。
- 對話結束後自動進入跑酷。

### 跑酷階段

- 採橫向跑酷。
- 婦女角色跑動。
- 羅馬士兵作為唯一主要障礙。
- 低位士兵需要跳躍。
- 高舉長矛士兵需要蹲下。
- 撞到士兵立即結束。
- 每越過一名士兵加 10 分。
- 每 15 秒提升速度或生成壓力。
- 前 15 秒不應過難。
- 單局通常應在約 2 分半內結束。

### 結束畫面

只顯示：

- 本局分數。
- 教學總結：「墳墓外有守衛，很難成功偷走屍體。」
- 重新開始按鈕。

不得顯示：

- 最高分。
- 排行榜。
- 登入入口。
- 雲端成績。
- 經文提示或章節引用。

## 測試要求

每個子 Agent 完成模組後，必須完成對應模組測試。主 Agent 必須完成整體端到端測試。

最低測試項目：

- 打開 `index.html` 能看到首頁。
- 首頁顯示主要角色與羅馬士兵。
- 點擊開始後進入接觸士兵階段。
- 左右按鈕能移動婦女。
- 婦女接觸士兵後顯示對話。
- 對話完成後進入跑酷。
- 跳躍按鈕能讓婦女跳起。
- 蹲下按鈕能讓婦女蹲下。
- 低位士兵可透過跳躍避開。
- 高舉長矛士兵可透過蹲下避開。
- 每越過一名士兵加 10 分。
- 每名士兵最多只加分一次。
- 每 15 秒速度或壓力提升。
- 撞到士兵後立即進入結束畫面。
- 結束畫面顯示本局分數。
- 結束畫面顯示固定教學總結。
- 重新開始後能回到接觸士兵階段並重設本局分數。
- 背景音樂存在。
- 跳躍、蹲下、加分、撞到士兵音效存在。
- 聲音開關能控制背景音樂與音效。
- iPad 橫向 viewport 中按鈕清楚可按。
- 直向 viewport 顯示旋轉提示。
- 全專案文字不包含經文章節引用。
- 全專案不包含最高分保存或最高分顯示。

如可使用瀏覽器自動化，必須使用 iPad 橫向尺寸進行 smoke test，例如 `1024x768` 或接近 iPad 橫向比例的 viewport。若沒有自動化工具，仍需用可用命令啟動本地靜態伺服器並執行所有可自動化檢查。

## 任務文件更新

完成每個模組後：

- 勾選對應 `doc/tasks/<module>.md` 中已完成項目。
- 完成整個模組後勾選 `doc/tasks/progress.md` 中對應模組。
- 所有模組整合完成後勾選 `doc/tasks/progress.md` 的整體完成標準。

不得提前勾選未經測試的項目。

## 最終交付標準

只有在以下條件全部滿足後，主 Agent 才能宣告完成：

- 所有模組已實作。
- 所有模組已整合。
- 首頁、接觸士兵、對話、跑酷、結束流程可以完整遊玩。
- iPad 橫向畫面可用。
- 聲音開關可用。
- 跳躍、蹲下、加分、撞擊音效存在。
- 背景音樂存在。
- 任務 checklist 已更新。
- 沒有最高分、排行榜、登入、後端、雲端成績、經文提示或章節引用。
- 測試結果已記錄在最後交付報告中。

最後回報時請提供：

1. 已完成的模組清單。
2. 主要檔案變更。
3. 測試結果。
4. 若有保守假設，列出假設與原因。
5. 若有未能完成的項目，列出原因與後續修正建議。
