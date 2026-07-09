# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間 | 階段 | 任務 | AI / Agent 建議 | 採用 / 拒絕 | 人類判斷理由 | 相關檔案 / commit |
| ---- | ---- | ---- | --------------- | ----------- | ------------ | ----------------- |
|      |      |      |                 |             |              |                   |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |

| 2026-07-09 | Phase 0 | 建立訊息分類工作台 | 使用一個簡化前端工作台，讓使用者可把未分類訊息標記為求助、資源或其他，並看到統計 | 採用 | 這個原型符合課程目標，保留未確認訊息的狀態，避免把推測寫成事實 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | Phase 0 | 改善分類頁安全標示 | Agent 建議把預設「已分類」改成需要人工確認 / 不能直接當作已確認事實，並移除程式補出的概略地點 | 採用 | 自動分類只是文字規則草稿；若顯示為已分類或補地點，容易讓使用者誤以為資料已可靠 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/phase0-observations.md` |
| 2026-07-09 | Phase 0 | 支援多個分類輸出 | User 指出一筆資料可能不只一種分類；Agent 將服務類型改成多選輸出，讓同一筆資訊可出現在多個服務分組 | 採用 | 原始資訊常混合多種線索，強迫單一分類會遺漏脈絡；但每個輸出仍只是待人工確認草稿 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/phase0-observations.md` |
| 2026-07-09 | Release 01 | 訪談前需求取捨 | Agent 依對話整理資訊整理者作為 v1 主要使用者，並補上轉發網路貼文的來源確認問題 | 部分採用 | 採用來源檢查清單與「未確認」標示；不採用自動驗證貼文真偽，因為這需要人工確認且不能補外部資料 | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md` |
| 2026-07-09 | Release 01 | 整理需求取捨文件 | Agent 將使用者貼上的重複草稿整理成 `docs/decisions.md`，保留人力需求欄位與人工確認限制 | 採用 | 人力需求可以作為整理草稿，但能不能派工、是否派人、派多少人仍必須由人類確認 | `docs/decisions.md`, `docs/ai-log.md` |
| 2026-07-09 | Release 02 | 繪製資訊整理流程 | Agent 根據 `docs/decisions.md` 和流程設計 kit 產生自然語言流程與 Mermaid 流程圖 | 採用 | 流程把人力/物資需求保留為草稿，並明確保留人類調度確認，避免 AI 自動派工 | `docs/flow.md`, `docs/ai-log.md` |
| 2026-07-09 | v1 | 生成資訊整理網站 | Agent 依 `docs/flow.md` 建立 `/v1/` 調度前資料整理台，顯示來源檢查、缺漏欄位、人力與物資需求草稿 | 採用 | v1 仍只使用 Phase 0 原始資訊，所有需求分類都是草稿，不顯示已確認派工，也不讓 AI 決定是否派人或派多少人 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | v1 | 改善整理後台可用性 | Agent 加上左側通報摘要、細分不可派工原因、新增通報輸入與每筆通報留言補充 | 採用 | 這些功能協助資訊整理者記錄缺漏，但新增通報和留言只暫存在前端，不代表資料已確認或已派工 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | v1 | 分離首頁分類頁與 v1 後台 | Agent 將首頁「訊息分類」恢復為原本分類草稿狀態，v1 另外保留調度前確認狀態 | 採用 | 避免 v1 功能影響原本依幫助需求分組的分類版面；首頁分類仍是草稿，不代表已確認資料 | `src/app/App.tsx`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | v1 | 補通報統整圖表 | Agent 在每筆 v1 通報下方加入人、事、時、地、需要帶的東西與下一步圖表，並保留留言補充 | 採用 | 圖表欄位只整理原始資訊線索；不明確內容顯示需要人工確認，留言也只作為前端暫存補充 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | v1 | 改善受災戶友善操作 | Agent 加上快速通報片語、缺漏一鍵轉留言，並調整 v1 為較溫和的綠藍配色 | 採用 | 操作降低輸入負擔，但仍只產生待確認草稿；不新增真實資料、不自動派工 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | v1 | 新增補充與幫助分類篩選 | Agent 將來源待確認、待補資料做成一鍵篩選按鈕，並新增醫療、物資、食物／飲水等幫助分類篩選 | 採用 | 篩選只協助找到需要補充的通報草稿，不代表資料已確認，也不會自動派工 | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx` |
| 2026-07-09 | 工具鏈 | 修正 `pnpm check` | Agent 將 `check` 改成直接執行工具、讓資料驗證改用 Node 24 執行，並忽略 release-packs 教材格式檢查 | 採用 | 這只修正驗證流程，不改原始資訊、不改救災判斷，也避免格式工具改寫課程 release 教材 | `.prettierignore`, `package.json`, `scripts/validate-fixtures.ts`, `src/contracts/**`, `tsconfig.app.json` |

## 課後反思

### AI 幫助最大的地方

- 快速找出分類頁可能誤導人的狀態文字，並協助把派工前限制顯示到卡片上。

### AI 最容易誤導的地方

- 可能把文字規則產生的分類當成已確認結果，也可能補出原文沒有明確提供的地點或派工判斷。

### 下次使用 AI 開發前，我們會先準備

- 先定義哪些狀態只能代表草稿、哪些狀態才可能進入後續人工確認流程。
