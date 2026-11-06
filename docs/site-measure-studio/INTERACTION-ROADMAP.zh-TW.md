# Site Measure Studio — 互動與 Kitchen 模板迭代規劃（討論版）

> Status: Living design plan / 未授權開始下一輪開發
> 基準：Preview 3.1，commit `5b7af6b`，feature branch `feat/site-measure-v0.2-canvas`
> 專案：`BaiCaiMark/baicai.dev` · `/tools/site-measure`
> 日期：2026-11-04
> 用途：先整理需求與驗收，再按優先順序拆成小型 Codex 任務。這份文件不是已完成清單。

## 1. 核心產品原則（已確認）

- **現場量尺優先**：拿著捲尺、平板（Huawei／Android）的工作者，應比手寫記錄更快地捕捉尺寸、Sink、Notes 和不同 Area；不是開發完整 CAD。
- **Project → Area（單一 Canvas）→ 多個 Part**。同 Area 的 Parts 可以視覺排列，仍保持獨立幾何和測量資料。
- **直接觸控**：Part 內部選取／移動；線段點選輸入尺寸和 Overhang；Sink 等參考物件應能直觀點選。減少模式、按鈕與鍵盤切換。
- **資料真實性**：Unknown 不等於 0；示意圖不等於實測尺寸；不自動建立虛假的 Gap／Opening／製造認證。Dimension、Overhang 與參考量測原始輸入保留。
- **畫布配置 ≠ 物理尺寸幾何**：移動、Snap、模板安排不應改動獨立 Part 尺寸；DXF 的真實幾何輸出不受視覺排版影響。
- **真實案例累積模板**：先能用 Single Vanity 和最簡單的 Kitchen；以後逐步把真實的 Kitchen / Bathroom 例子變成可編輯模板，允許刪除 Island、自加 Part。
- **少量迭代**：每次僅做一組緊密相關功能；先由使用者試用，才決定下一輪。保護正式 `main`；發布於同一 Preview 分支。

## 2. Preview 3.1 現場反饋（已確認）

- 正面：Part 移動已「絲滑」，應保留既有 Pointer Events / Undo 質量。
- 問題 A：四向 Move 把手在 Part **外面**，要找小圖示再拖，很不直觀。
- 問題 B：缺少 Part 之間的水平／垂直對齊；Stove 左／右 countertop 需要對齊同一後緣，之後又要保持中間 30″ 等間隔。
- 尚待真機核查：Android 軟鍵盤、分數快捷輸入、Overhang、Sink Center、雙指縮放、觸控取消。

## 3. 下一次 Codex 開發：Preview 3.1.1 — Direct Drag + Alignment（建議優先）

### T1 — 直接拖動已選中的 Part（優先）

- 點 Part **內部** = 選取；再次按住並拖曳已選中 Part 的內部 = 移動；放開 = 單次可 Undo 的位置更新。
- 點／點擊真實 Edge = 編輯對應尺寸（不被拖動手勢攔截）；空白處拖 = Pan；雙指 = Pan／Zoom。
- 保留外部現有 Move 機制或合適的備援操作（鍵盤可達）；可移除惱人的外置把手或改成不遮擋尺寸的內部輔助，不要令手柄成為唯一入口。
- 設清楚的 tap-vs-drag 閾值及選取優先序；`pointercancel`、第二手指、失去 pointer capture = 不意外 commit。
- 已選中 Part 的邊緣仍可直接量尺；不應觸發移動。任何移動只更新 `layout`，不改幾何、資料、輸出。

### T2 — 輕量 Alignment Snap（同一 Preview，獨立於 T1 實作／測試）

- Parts 拖近時可對齊 top/bottom/left/right，視需要 center X/Y；優先滿足 **Stove 左右兩片後緣水平對齊**。
- 顯示短暫且清楚的對齊輔助線；落點吸附。距離閾值以**螢幕 CSS px** 而非圖形 mm 定義（初始建議約 8–12px，實測調整）。
- 提供清楚的 **Snap On/Off**。避免重疊 Part、短邊、極小 Fit All 比例下的吸附抖動；可按最近且最合理的線優先並加入滯後 (hysteresis)。
- Snap 只是視覺安排：未量完的 Part 可能是 template guide / 非等比例。不可藉此認定房間尺寸或補上未知值。
- 拖動對齊後仍保存視覺位置，Undo／Redo 正確。

### T3 — Ortho Move（可以與 T2 同版，若風險過高另拆）

- 將一次拖動約束為 X 或 Y 軸（以開始移動的主要方向鎖軸），在平板提供明確的 Ortho Toggle；桌面 Shift 可作輔助。
- 目的：在左右 Part 後緣對齊後，水平拉開 Stove 開口時不偏移 Y。
- Ortho 不代表能輸入精確的 30″；那是後續的 Set Gap／設備參考功能。

### Preview 3.1.1 驗收清單

1. 單指點選 Part 內部，再單指拖動，不需找外部圖示；不破壞 tap Edge。
2. Blank pan、pinch zoom、L-shape 內角選取在桌面與模擬觸控皆正確。
3. Left countertop 與 Right/L countertop 後緣吸附對齊，有清楚的視覺反饋。
4. Ortho 能維持 Y 不變，只作水平移動；Snap Off 可自由定位。
5. 所有 layout 位置 autosave、backup/import、Undo/Redo 後一致。
6. 相同測量資料，移動前後 PDF／DXF 的原有幾何與量測資訊不變。
7. 不修改 `main`、production、Vercel 保護設定。

## 4. 後續設計：Stove、Gap 與固定基準（先設計再開發）

### 明確區分三個概念

1. **Stove（設備物件／Equipment Reference）**：不是 countertop Part，也不是 Cooktop cutout。
2. **Stove nominal width**：如 30″／36″，表示設備標稱尺寸；不等於已確認的實際開口。
3. **Required opening / Gap**：左右 countertop 實際應預留的開口，需依設備安裝要求和實測確定；可以 Unknown，不能默認與標稱寬度相等。

### Desired UX

- Kitchen 模板放置 Stove、左 Countertop、右 Countertop（可能 L-shape）及可選 Island，布局已合理。
- 使用者可選 30″／36″ 或自訂設備尺寸；若知道 Required Opening 可另外輸入，隨配置更新**可視化間距**。
- 初期只更新各 Part 的視覺 layout，不改其 measured geometry。只有被證實為完整且真實比例的幾何才能聲稱圖中間隙為精確 30″；Incomplete guide 不得假裝成真實等比例。
- 指定 **Anchor（固定基準）**：靠 Stove 的左 Part 右端與右 Part 左端；改 Part Length 時，尺寸向遠離 Stove 一側伸展，而非擠壓 Stove。Mirror／Rotate、不同邊緣與 L-shape 必須測試正確。
- 用最小可行的 **模板特定關聯布局**，避免開發全能 CAD constraint solver。
- 是否將兩個 Part 互相綁定、改值時自動重新排列、手動移動後是否解除關係等，**尚未決定**；不得默認強行聯動。

### 待決策問題（在討論中確認）

- 常見 Stove 用法需要只記錄 **Opening Width**，還是同時記錄 **Nominal Width + Opening**？建議模型支援兩者，但 UI 可只露出最常用欄位。
- 對齊優先使用「靠牆後緣／Back edge」還是任意 top/bottom/center？需由現場示例確認。
- 未完成尺寸的形狀如何呈現精確 Stove 開口？建議先標「30″ opening recorded」但不承諾導出的空間等比例。
- 多個自由 Parts 與智慧模板約束並存時，使用者如何解除／恢復 Anchor？
- 真實 Stove 安裝要求來源及開口的量測狀態（measured, specified, unconfirmed）如何記錄？

## 5. 模板路線（功能依賴順序）

- **M1 — Bathroom / Single Vanity**：Rectangle + Sink Center，零實測數值先設 Unknown，能快速輸入 Length、Depth、Front Overhang、Sink Center 和 Notes。
- **M2 — Kitchen / Basic L**：一個 L-shape + Sink + Cooktop 參考標記；Mirror 能對換朝向，但設備應能選擇所屬腿／定位基準。
- **M3 — Kitchen / Stove + L + Optional Island**：由左 Rectangle、右 L-shape、可刪除 Island，加 Stove Equipment Reference 組成；大致位置預先排列，明確區分 Stove 和 Cooktop。
- **M4 — Smart Kitchen（後續）**：Stove width／Opening、Anchor、更新參數後關聯重排；支持自由移動、刪 Part；版本化模板與非破壞性工程相容。
- 以後根據真實案例增加模板，而非先建立大量抽象幾何／CAD 功能；可研究 Save as Template。
- 模板初始化不代表所有尺寸可加工，DXF 仍維持 Unknown 排除政策。

## 6. Sink 直接交互（與 Stove 分離的獨立工作包）

- Tap/Add Sink → 指定所屬 Part 和 L 的腿 → 示意放置 → 點 Sink 編輯 X/Y 實測定位。
- 明確選擇左／右、前／後，並考慮腿的**局部基準**；當前使用整個 L bounding box 可能不直觀。
- 點在畫布上只設定圖面示意，不虛構精確尺寸；X-only / Y unknown 狀態仍可保存和匯出備註。
- 保留既有 Sink Center／Cooktop reference 及舊工程遷移；Mirror 不得偷偷顛倒實測位置。

## 7. PDF & DXF（後續）

- PDF 可增加獨立 **Area / Kitchen Overview**，反映視覺 Part 配置與標註「schematic layout, not surveyed room coordinates」。
- 後續仍保留每 Part 精確尺寸、allowances、notes、provenance／待核查記錄；輸入資料不能丟。
- DXF 繼續使用獨立、可編輯、真實尺寸的製造幾何，不因示意畫布位置虛構機械加工座標。

## 8. 實施／省額度規則

- Codex 任務按 **T1 → T2 → T3 → M1/M2 → Sink → Stove & Gap/Anchor → M3/M4 → PDF Overview** 的依賴與現場回饋重排；「建議」不是固定排程。
- 每個工作包提供明確：目標、現有程式依據、非目標、手勢狀態、資料安全、驗收案例、回滾策略。
- 小步 PR／Commit、完整 core/browser/TS/lint/build、PDF/DXF 回歸、Preview READY；**不 merge main、不 deploy production、不改 Vercel 登入保護**。
- 真正 Android/Huawei fingers + stylus/keyboard 必須由使用者驗收；模擬觸控 ≠ 真機驗證。
- 此規劃文件可在討論時更新；每次將新增想法分類為「Confirmed / Proposed / Open Question / Deferred」，避免 Codex 按猜想實作。

## 9. 討論追蹤（持續補充）

- [Confirmed] 統一 Canvas，多 Part；移動絲滑；外部箭頭把手反直觀。
- [Confirmed] 希望直接拖動選中的 Part；希望 Snap、Ortho，對齊 Stove 左／右兩側 countertop。
- [Confirmed] 未來希望 Kitchen 模板含 Stove、左右 countertop、可選 Island，允許 30／36″ 等尺寸變更，避免尺寸往 Stove 空間擠壓。
- [Open] Stove 的標稱設備寬度、安裝開口與現場實測如何在 UI 呈現與優先。
- [Open] 對齊預設 anchor、關聯是否自動維持及如何解除。
- [Deferred] 高階 snapping、完整 CAD constraint solver、自動佈局識別、複雜自由繪圖。

## 10. 2026-11-04 新增：Open Edge 語義、Cabinet → Finished 可見計算（使用者截圖回饋）

### 問題重現（已確認的產品需求）

使用者在 Preview 3.1 的 Rectangle 2 輸入 **Cabinet 60″ × 21″**。原先對左右各填 1″、前後各填 1.5″，後來澄清這塊並非 Island：**右邊 Open，僅右端 1″ Overhang；前邊 1.5″ Overhang；左端與背後 0″**。因此期望 **Finished 61″ × 22.5″**。

螢幕仍只突出顯示 60″／21″，而 Part caption 為 `Incomplete · template not to scale`。根據現有程式 `core/geometry.ts`、`core/worksheet.ts`、`components/MeasureCanvas.tsx`：只要 Cabinet 尺寸已知，但**仍有未知／無效 Overhang，或另有數值衝突**，`g.top` 就是 `null`，畫布退回 `g.base`（Cabinet）並以 dashed guide 顯示。線段標籤此時顯示 Cabinet，卻未直接說明 Finished 未就緒的原因。不能假定目前已確實填完所有四邊；需要以實際工程資料再驗證是哪一邊 Unknown／衝突。

### 區分三個概念（架構決策建議）

1. **Edge role／邊緣關係**：例如 `Back to wall`、`Against adjacent Part/Stove`、`Exposed / Open`（可日後擴充）。角色描述**相鄰環境及加工需求**。
2. **Overhang／伸出量**：每條邊獨立的實測／手動設定值（0、1″、1.5″、Unknown 等），不能把 `Open` 自動等同 `+1″`；Open 亦可 flush／0。
3. **Anchor／定位基準**：修改尺寸時哪個位置固定、向哪個方向延伸。這與 Open 與 Overhang 有關，但不是同一欄位；未來 Stove 模板指定 Anchor。

### 建議 UX（待使用者討論細化）

- 選 Part 時能直接看到或編輯 **四側 edge role**，例如 `Back: Wall`、`Right: Open`、`Front: Open`、`Left: Adjacent / No overhang`；實際 Overhang 仍需顯示為各自的數值，不以 edge role 私自推算尺寸。
- 由畫布直接點邊：應能清楚選取 **哪一條實際可見邊**（Mirror／Rotate 後尤其重要），顯示 Edge role、Cabinet 相關尺寸、該側 Overhang，和受各側影響的 Finished 結果。配置可以採單個 Part 的 `Edges` 快速總覽，而不必逐一打開折疊設定。
- **雙層尺寸表達**：已確認的 Cabinet Dimensions 與 Finished Dimensions 可區分（例如內層淡色 Cabinet、外層主要 Finished），避免把 60″ 當成 61″ 的成品值；避免在小平板上同時顯示過多重疊數字。
- **可見計算式，優先尺寸總結**：
  - `Cabinet Length 60″ + Left 0″ + Right 1″ = Finished Length 61″`
  - `Cabinet Depth 21″ + Back 0″ + Front 1.5″ = Finished Depth 22.5″`
  - 以上是矩形的軸向加總。L-shape、特定 Edge 的成品邊長必須依既有幾何求解器，不可把任意同側 allowance 直接加到邊長。
- 如果仍有 Unknown，依然展示 **Cabinet 60 × 21（已輸入）**、**Finished Incomplete／Unknown（未推算）**，並指出缺少的具體 Side（如 `Back overhang unknown`），不能默認 0；「Template not to scale」不可錯誤地混淆已按比例顯示的 Cabinet 外框與尚未完成的 Finished 外框。
- PDF 保留 Cabinet、每側 Overhang、Finished、計算式及來源；DXF 僅輸出已完成的真正幾何，原始測量資料無損。
- 未來 Kitchen 模板可用 role 作為 `左靠 Stove／右 Open／背靠 Wall／前 Open` 的預設語義，讓使用者只需核對及修改，而不把預設當成已確認實測。

### 最小可驗收案例（未授權實作）

- Rectangle Cabinet `60 × 21`；Back=0, Right=1, Front=1.5, Left=0 → Finished bounding `61 × 22.5`（inch）；畫布、編輯面板、PDF 一致；左右兩側 60/61 不混淆。
- Rectangle Cabinet `60 × 21`；Back=1.5, Right=1, Front=1.5, Left=1 → Finished `62 × 24`（inch）：確認每側 Overhang 獨立相加，不要因為是普通 Rectangle 就預設單側。
- 任一側 Unknown → 不生成完整 Finished／DXF outline；顯示**未完成原因**，但已輸入的 Cabinet 長深仍可見。
- Role 設 `Open` 但 Overhang=0 或 Unknown → 不自動改成 1″，保留原值。
- Undo／Redo、Backup／Import、Project default 覆寫、Mirror／Rotate 之後，role 與 Overhang 必須仍對應正確**物理邊**。
- 與既有 `Preview 3.1.1 Direct Drag／Snap` 可以分不同小批次開發，不要一次改動 Canvas、幾何、資料模型與所有模板。

### 待討論

- 是否需要獨立的 `Open / Wall / Adjacent` 類型，或先以清晰的 `Edge label + 0/Unknown/Value` 完成 V1？目前建議長期支持 role，但先做容易驗收的計算可視化。
- 當模板載入時，`Open` 是否只提供**預填建議**，其數值狀態是否必須明確標示 `Default / Unconfirmed`？避免誤認已現場量過。
- Cabinet 與 Finished 的尺寸顯示，平板畫布預設怎樣呈現最簡潔（切換／雙層／選中時浮出），待實際試用。

## 11. 2026-11-04 使用者再次確認：最優先「少量數據快速記錄」，不是複雜配置表

- 使用者反饋：現有尺寸／Overhang 輸入流程**不直觀，體感不好**；實際到場量尺寸常常「就幾個數據填進去」，若為補充／比較量測更只需快速記幾個值、標記 Open 邊。絕不可因為要做嚴格幾何，就讓初步記錄變得像完成工程表單。
- 對先前「沒有填完」的歸因應保留不確定性：截圖可見 Cabinet 60×21 且 Finished 顯示未完成，但無法僅從圖確定是否有 Unknown、輸入無效、資料衝突或 UI 誤導。需先實際檢查工程現況，不能責怪操作人。
- 互動設計優先改為 **Quick Capture first / Geometry validation later**：點線直接輸入量測值；點邊可以標記 Open／Wall／Adjacent；少量通用備註與自由參考量測應隨時可保存。不需先進入多層設定或填完四面 Allowance 才看見已記的數字。
- 單一畫布、單一主流程，不輕易增加「模式切換」。只在真正需要完整 Finished Geometry／製造 DXF 時，要求必要的 Overhang 值與資料驗證。**保存記錄的門檻 ≠ 生成完整可製造輪廓的門檻**。
- Open 是側邊標記，不能偷偷當作 +1″；Wall 不能自動當作 0″。若要讓使用者用一個點擊明確選擇「No Overhang (0)」，要直接可見並告知會記入 0；Unknown 仍是 Unknown。
- 圖上分別顯示「目前已量到的 Cabinet 60 × 21」和「Finished 尚未完成／缺哪些」，不要全頁只顯示 Cabinet 的數字且讓人誤以為是 Finished；在任何過渡階段都有可用的速記／記錄成果。
- 與 Direct Drag / Snap 可以分開交付：優先做簡單的尺寸和邊緣記錄操作設計評審，別過度設計獨立模式和大型表單。

## 12. 2026-11-04 截圖確證：未完成的兩條 Overhang 與預設套用位置混淆

使用者從「Measurement record & checks」截圖顯示：Cabinet 60″ × 21″；`Overhang Back run = 1″ · Project default`；`Right end = 1.5″ · Project default`；`Front edge = Unknown · Manual allowance`；`Left back run = Unknown · Manual allowance`。因此**目前記錄值**並非使用者意圖的 `Back 0, Right 1, Front 1.5, Left 0`；Geometry 無法形成 Finished outline 完全符合現有嚴格 Unknown 政策。不能斷言使用者當時未嘗試填寫；有可能是在 Defaults 頁設置、選錯邊、或控制值未按預期保存；需以操作回歸測試釐清。

即時修復現有資料：逐邊明確設定 `Back=0″`, `Right=1″`, `Front=1.5″`, `Left=0″`，期望 Finished `61″ × 22.5″`。盡量改進 UI 成一眼看懂的 **四邊總覽／邊線上直接設定**，並提供已輸入 vs 未輸入 vs Project Defaults（預設僅參考，不等於已套用至所有邊）的清楚區分。注意現有 Rectangle 的 `Left back run` 標籤來自 L-shape 通用 mapping，對 Rectangle 不直觀，應顯示 `Left end`；Back/Right/Front/Left 四條物理邊在 Mirror/Rotate 後仍需與選取正確對應。

核心 UX 驗收：一位不讀文件的使用者能在畫布設定 `Cabinet 60×21, 四邊 overhang 0/1/1.5/0`，立刻看到 `Finished 61×22.5` 與兩個計算式，不需打開「Measurement record & checks」才能發現是哪條邊 Unknown；若確有輸入卻未保存，必須另查自動儲存及 onBlur/切換觸控時序。

## 13. 2026-11-04 截圖驗證：全部設 1.5 才看到成品，代表輸入成本過高

- 新截圖 `Rectangle 2` 顯示 Finish `63″ × 24″`，且輪廓內有 Cabinet 虛線。已知 Cabinet 60″ × 21″、使用者表示四側都輸入 1.5″ → 矩形結果正確：`60 + 1.5 + 1.5 = 63`、`21 + 1.5 + 1.5 = 24`。
- **這是為了讓成品顯示而被迫填滿四條邊的測試，不是使用者想要的加工設計。** 他的實際意圖仍是 Back=0、Right=1、Front=1.5、Left=0 → Finished 61×22.5。
- UI 的第一任務應是快速得到與現場一致的尺寸/邊緣資訊，避免每個 Part 都要走四段深層數值輸入。若為常見單邊 Open 或雙邊 Open，可以一個簡單動作指定 Open 邊、設定相應 allowance，並**明確確認**其他非 Open 邊 `No overhang (0)`。不可以暗自把未知邊當作零，也不應僅因 `Open` 角色自動輸出固定尺寸。
- 建議「Edit edges」四邊直覺佈局或直接點線，且有 **`Set remaining unknown overhangs to 0`** 的清晰捷徑，按下即真正記錄零值並可 Undo；不要放在長卷動頁尾；持續展示 `Cabinet 60×21`、完成條件及 `Finished` 結果/清楚計算。
- 交互優先於新模板。驗收以現場操作**幾次點擊才完成 60×21 → 61×22.5** 為準，而非「表單最後能算出 63×24」為準。

## 14. 2026-11-04 計算式的視覺閱讀順序（已確認）

使用者糾正：之前用 `60 + 0 + 1` 表達 Left 0 + Cabinet 60 + Right 1，雖然算術相同，但**視覺上不直覺**。若完整展示，應嚴格按照實際剖面位置 **由左到右、由後到前** 排列：
- Length full: `Left 0 + Cabinet 60 + Right 1 = Finished 61` → `0 + 60 + 1 = 61″`
- Depth full: `Back 0 + Cabinet 21 + Front 1.5 = Finished 22.5` → `0 + 21 + 1.5 = 22.5″`
- **預設極簡顯示**可省略 0，顯示 `60 + 1 = 61″`、`21 + 1.5 = 22.5″`。完整四邊資訊依然保留於邊線標籤或可展開詳情。
- 對 90/180/270° Rotate 和 Mirror，**先依螢幕上變換後的物理位置**對應視覺順序，不要沿用原始模型語義排序而造成左右/上下錯置。
- 不得省略 Unknown 項或當成 0；在必要邊未知時顯示 Incomplete/Unknown 和缺少的邊。
- 繼續堅持幾何 solver 正確性；L-shape 不能生搬硬套矩形的兩端相加公式。字面簡潔不代表省略真實可核查數據。

## 15. 2026-11-04 使用者確認：行動端 Overhang 快捷選擇與整組預設

### 最重要的使用習慣（Confirmed）
- Left / Right **end Overhang** 常用快捷值：`1/2″`、`3/4″`、`1″`；特殊數值允許 **Custom 手動輸入**。
- Front **Overhang** 常用快捷值：`1 1/2″`、`1 3/4″`；特殊數值可 Custom。
- **一鍵套用常用預設（Preset）**：Left 1″、Right 1″、Front 1 1/2″（使用者例子；可調整 Project Defaults），不需要逐邊填三次表單。
- 每條邊都需要清楚可點的 `0 / No Overhang` 與 `Unknown` 選項。不得因為套用 Default 而悄悄設定未提及的 Back 端；Back 的處理需清楚展示（保留舊值／Unknown 或讓使用者明確設定 0），不能自動臆測。
- 後續針對單邊 Open 也能：套 Preset → 點非 Open 端選 `0`，快速得到指定尺寸，不必展開長表單；但 `Open` 標記與 Overhang 數值仍是兩種資料。
- 在 Part 選中時顯示醒目、可預覽套用範圍的 `Apply common overhangs`；逐邊選取時顯示不同情況的**一排大觸控按鈕 / chips**，例如 End: `0` `1/2` `3/4` `1` `Custom`；Front: `0` `1 1/2` `1 3/4` `Custom`。
- 需保留每項來源（Project default vs Manual allowance）、支持 Undo/Redo；一鍵 Preset 不得無預告地覆蓋已有實測／人工修改的數值，應清楚標明將覆寫哪些欄位並確認，或預設僅填未填欄位。
- 視覺展現仍優先 `60 + 1 → 61″` 及 `21 + 1 1/2 → 22 1/2″`；完全已知的 0 才省略，Unknown 不能當 0；算式完整展開時順著圖上的 Left → Cabinet → Right、Back → Cabinet → Front。
- L-shape 的邊與投影基準需明確，不能將矩形的 Left/Right/Front 快捷分類未經確認地套到所有內角邊。先驗收 Rectangle 基礎。
- 任務可以獨立於 Direct Drag/Snap 實作，優先解決現場資料輸入效率。

### 尚待驗證／討論
- 預設組合是否允許 Back 單獨選擇 `0″` 作為常見 Wall 配置？目前使用者只明確說 Left/Right=1、Front=1.5，Back 不能自行默認。
- 快捷按鈕排列時機：點選 Edge 後就出現，或另設 Part 層的四邊小總覽。需拿 Huawei 真機測試尺寸與軟鍵盤。

## 16. 2026-11-04 使用者修正：0 不需列為主要快捷鍵，Open 驅動 Overhang 預設

- 使用者否定「0 是重要的高頻快捷按鈕」這個先前 UI 假設。其現場習慣是：**先決定邊是否 OPEN／需要打磨的可見邊**。非 OPEN 的邊通常直接預設 **0″**；OPEN 邊預設對應類型的標準 Overhang，為 0″ 的 OPEN 邊反而是特殊需求，需要 Custom 明確覆寫。
- 建議最小操作：選 Rectangle／基本 Vanity → 點邊標 `OPEN`（或從模板預設）→ 系統按角色套建議 Overhang：Left/Right 端常用 1″，Front 常用 1 1/2″；非 OPEN 預設 0″。OPEN 的快捷選項 End `1/2`、`3/4`、`1`、Custom；Front `1 1/2`、`1 3/4`、Custom。**0 不必作為醒目第一顆按鈕**，但 Custom 仍必須可將 Open 設成 0。
- 例子：Cabinet 60×21；Right OPEN → +1，Front OPEN → +1.5；Left、Back 非 OPEN → 預設 0 → Finished 61×22.5，無需手動填四個 allowance。
- UX 約束：一鍵自動帶入的是**有來源的模板／專案預設值（unconfirmed）**，不能冒充現場實測；應在畫面可查看與覆寫。角色標記可以影響預填，但**OPEN 不與非零 overhang、polish 完全等價**：打磨工序與 Overhang 數值須保持獨立，開放但 flush／特殊 0 必須支援。
- 當使用者切換 OPEN ↔ 非 OPEN 時，不可無聲覆寫已人工輸入的特例；需顯示保留／恢復預設等可理解的行為。沒有使用者或模板確認的未知資訊仍須明確與 Project Default 區分，避免把推測當測量。
- 這一項**取代**先前「0 是主要顯眼的 Overhang 快捷鍵」設計；下一輪應先針對一個 Rectangle 實際案例驗收，不要擴展成多層角色表單。

## 17. 2026-11-04 術語修正：不可用 OPEN 綁死 Overhang；Waterfall 是獨立接合邏輯（Confirmed）

- 使用者同意：「OPEN」只是暫時的口語說法，容易產生歧義。之後 **不要將 OPEN 當成 Overhang 或打磨邊的正式欄位名稱／唯一狀態**。在規劃前文的 OPEN quick-toggle 構想，應視為「希望快速指示哪條邊有特殊處理」的需求，而不是已定的資料模型。
- **Overhang 可為 0″、1/8″、1/2″、3/4″、1″、1 1/2″、1 3/4″ 或自訂**；開放、可見或需要 polish 的邊不必然有正 Overhang；必要時可為 0 或極小值。非 OPEN（例如靠牆）也不應被推定一定 0。保持可直接編輯數值並具清楚來源／預設狀態。
- **Edge visibility / adjacency（靠牆、外露、相鄰物件）**、**Edge finish / treatment（polished, no-polish, miter 等）**、**Overhang（伸出量）** 必須概念分離，避免用一個狀態推論加工需求及尺寸。對使用者的簡潔 UI 不一定同時暴露三個複雜設定；只呈現當前需要的選項。
- **Waterfall** 不是普通 Overhang：相應幾何可能需要石材厚度 `2 cm`／`3 cm` 的補償與接合計算，具體是相接尺寸如何加減，**依 miter / butt joint、加工方向、成品厚度與基準而定**；切勿不經工法確認就固定 `+2cm` 或 `+3cm`。作為獨立的未來 `Joint / Waterfall` 功能工作包，**不納入近期 Overhang 輸入優化**。
- UX 方向仍是最少點擊：Cabinet 長深 → 在圖上選邊 → 點常用 Overhang chip 或 Custom → 即時顯示 Finished。先不因為命名引入龐大表單／複雜 CAD 製造系統。
- 先前第 16 節中 `OPEN → 自動賦值，Not Open → 0` 是尚待設計的草案，**被本條概念性修正取代**；不可直接依第 16 節實作角色到數值的硬綁定。

## 18. 2026-11-04 製造工序主導的簡化定案（Confirmed，取代前述 OPEN/Wall 拆分入口）

- 使用者指出最常見情況：「左邊和後面是牆壁 → 不打磨；右邊、前面打磨」，現場**以加工工序決定主要操作**，不需要反覆填三套邊緣分類表。
- **Edge Treatment 目前只有 `No Polish`、`Polish`、`Miter`** 三種。日後若有第四種再擴充；這三種作為界面主選項，現場語言比抽象的 OPEN 更重要。
- Overhang 仍是**獨立可覆寫的量測／預設值**。靠 Stove 的 Polish 邊常是 0″／1/8″（小尺寸），一般 Side Polish 預設 1″，Front Polish 預設 1½″；Polish=0 或 1/8 都是正確特殊情況，沒有硬性限制。
- 常用 Rectangle 工作流：`Cabinet 60 × 21`、預設前邊 Polish +1½、其他 No Polish +0 → 點右邊改 Polish +1 → Finished `61 × 22½`。數字來源是 `Default / unconfirmed` 而非假冒實測，使用者仍可直接覆寫。
- Miter/Waterfall 涉及 2cm/3cm 材料厚度與接合方式，**不因選 Miter 自動加任何材料厚度**。Miter 先作為可儲存的工序標記。
- Quick Measure 是主要入口，舊版「More details」保留 Sink/Notes、field records 和 advanced。新工程需一眼看到 Cabinet、Treatment、Overhang 快捷按鈕、Finished 計算。已知的 0 可以在簡潔式省略；未知不能默認為 0。
- **真實使用優先**：不必等 Stove 智慧模板／Waterfall solver 完善才發布；現場實測發現常見重複動作再加入 preset。測試/備份/校驗過後合併 main，讓 Android 平板使用穩定 Beta。

### 本輪 Preview 3.2（開發中）
- Quick Measure / Treatment / Rectangle 常用預設 / Edge Overhang chips、Custom。
- 選中 Part 內部直接拖動；Snap On/Off 與 Ortho On/Off （Snap 視覺引導線、智慧 Anchor 等仍待後續調整）。
- 保持既有 JSON schema v2 可以讀取舊工程；原有 PDF／DXF output 及 IndexedDB 保護；新 PDF 記錄 Treatment，但不憑 Treatment 假造加工幾何。
- 必須通過 core、瀏覽器與 build，先發 Preview，再合併 main。原 Preview origin 資料不會自動出現在 production origin，需備份／匯入。

## 19. Canvas-first 互動原型（2026-11-05，先在 Preview 使用 `?direct=1`）
- 工地驗收的首要阻礙不是缺少功能，而是開啟 Vanity 後必須理解「總長/最深/淺位/深位寬」等 List 欄位。單純翻譯不會解決問題。
- 本輪做成**可比較的原型**：開啟 `/tools/site-measure?direct=1`，新建 Rectangle 或 Vanity Step 後**不彈出列表**；逐條點選畫布上的邊，在圖上出現極短的尺寸輸入框、Overhang 快捷鈕與 No Polish / Polish / Miter。每條邊的實測值仍進同一套嚴格幾何計算。
- 階梯 Vanity 的四條控制邊直接在圖面標上「總長」「最深處」「淺位深度」「深位長度」，其餘兩條為根據四數得出的計算邊，不假冒獨立實測。
- 邊上可以加短 Note（例：左牆斜 1/4″）；記錄仍與該邊綁定，文字以黃色 Note 標記顯示在畫布上，PDF / backup 維持原有 fieldRecords 路徑。
- 選擇 Part 後按 `＋ Sink`，畫布出現 Sink 定位標記及 X/Y 快速輸入；尚未量到的定位會以問號表示，不假造 Sink Cutout。
- 原表單留在 `欄位設定` / `更多設定`，平常不必開；一般連結先保持 Classic，待使用者 Android 真機驗收，再決定是否讓 Canvas-first 成為預設。
- 未包含任意牆線手繪、任意位置 Notes、精確局部截面、Waterfall 幾何補償。牆偏斜仍只是 Note；不宣稱可直接 CNC。

## 20. 工地反饋修正：Finished、OPEN + 1½″ 與 Move handle（2026-11-06）
- 以 Canvas-first 模式為首要驗收對象。畫布數字的語義**一律為 Finished Countertop 尺寸**；Cabinet 量測值只在直接編輯器中輸入/核對。尚未算出完整 Finished 時，圖上標成「? / FINISHED ?」，禁止退回顯示 Cabinet 尺寸冒充成品。
- 新建 Canvas-first Rectangle：Front OPEN 預設 Front Overhang 1.5″；非 OPEN 邊 0。新建 Canvas-first L/Vanity Step：兩條朝前的水平邊 `front`、`innerX` 預設 OPEN 及 1.5″；其餘非 OPEN 預設 0。預設來源是 `default / unconfirmed`，絕非現場已確認尺寸。
- 畫布點任一條邊直接選 OPEN / Not OPEN（與 Polish、Miter 分開記錄），OPEN 自動套用對應專案 Overhang 預設（前邊 1.5″、側邊 1″）；Not OPEN 預設 0；保護手動輸入的 Custom 值，不能因切換 OPEN 而覆蓋。每條邊均提供顯眼的 1.5″ 快選，不再要求使用者重複鍵盤輸入。
- 已存在的舊 L 工程若沒有 OPEN 資料，提供一次性的「套用 OPEN 預設」入口，手動 Custom allowance 不改。
- Canvas-first 移除圖形右上角的十字 Move handle；Part 內部直接拖曳即移動，邊線點擊繼續優先進入尺寸編輯；Classic 暫維持原功能以保留回歸比較。
- 保持局限：這是現場量尺示意工具；未完整量得的輪廓不能稱為可 CNC 的精確 finished 檯面。

## 21. 方向尺寸與實體邊屬性分流（2026-11-06，Canvas-first Preview）
- 工地用戶指出：點「上方 60」卻要另外點右側才可設定 1″，點「右邊 21」卻要另外點下方才可設定 1.5″，嚴重違反手繪筆記直覺。
- 本輪實作將 **Dimension label** 與 **Physical edge line** 視為兩個不同的操作目標：
  - 點尺寸數字（在標註線外側的白色小框）→ 小型方向輸入區，列出該方向兩端 Overhang + Cabinet 實測，立即顯示 Finished；右側 End 1″ 及前方 1.5″ 可在同一個畫面一鍵選擇。
  - 點檯面實際邊界 → 獨立的 OPEN / Not OPEN、No Polish / Polish / Miter、Note，**不再顯示 Cabinet 尺寸 / Overhang 的長表單**；OPEN 仍可帶入預設，手動覆寫保護既有規則。
- 示範：Rectangle 右側 OPEN 給 1″，上方尺寸選框直接編輯 Left 0 + Cabinet 60 + Right 1 = Finished 61；右側尺寸選框直接編輯 Back 0 + Cabinet 21 + Front 1.5 = Finished 22.5。
- 不需等待所有尺寸完整，已量得單一方向和其兩端 allowance 的 Finished 數字即可在圖上顯示；**整個輪廓未完成時仍標示 Finished · incomplete，DXF 不得誤當可加工圖**。
- 圖紙移除自動加上的中文「總長/最深處/深淺差」標籤；只留下尺寸數字與使用者自己的 Note。直接模式移除冗餘 Move 工具列按鈕，仍可以拖動選中的 Part。
- L-shape 保持四個獨立控制尺寸；內凹邊的計算尺寸只讀，方向算式由 `dimensionTerms` 綁定幾何而非依外觀猜測。
- Classic / main 的操作暫不替換。用戶驗收後再評估是否成為預設。

## 22. Bathroom Vanity 的 Sink Center 改為 X-only、雙盆直接編輯（2026-11-06）
- 現場實際流程：量 Sink Center 只需「距左邊或右邊多少」，通常**不量前後 Y**。原先硬顯示 X/Y 是反直覺表單。直接輸入模式預設僅顯示 Left / Right 和一個距離，Y 不再需要填寫，且空白 Y 不被視為遺漏必填；仍由 Advanced 保留特殊需求。
- 主臥常是 Double Sink：面板內直接顯示 Sink 1、Sink 2 切換與 `＋ Sink`，新增第二盆不跳到 Advanced；上方 `＋ Sink` 也會新建獨立 reference，而不永遠重開第一盆；可在同一面板移除多餘 Sink（需再次確認）。
- 畫布以 S1、S2 標示兩個中心的 X 讀數；有 X 無 Y 時，標記只放在示意位置（虛線），**不能冒充已量到 2D 真實坐標**。X 確認後可依左／右基準沿畫布 X 軸定位；資料不足時不產生虛假精確幾何。
- JSON backup / Undo / PDF 保留每個 Sink 的獨立 X 原始輸入與 fromX；PDF 用 Sink 1、Sink 2 區分，未填 Y 不再報「Y unknown」。DXF 不因這些示意定位生成 Sink Cutout。Cooktop 保留原本完整 X/Y 操作與校驗。
