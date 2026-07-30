# 可直接貼給 Codex

請重構目前的 `baicai.dev` 網站視覺，但先閱讀我提供的品牌素材包：

1. `README.md`
2. `BRAND_GUIDE.md`
3. `CODEX_IMPLEMENTATION.md`
4. `styles/brand-tokens.css`

核心決定已經確定：

- 完整人物徽章固定使用 **A1 白菜守望者**。
- A1 用於首頁 Hero、About、404 或大型頭像，不能用作 favicon 或導航小圖標。
- 網站正式 Logo 使用 **Future B**，用於導航、favicon、GitHub、PWA 與各種小尺寸。
- 整體風格是沉穩、神祕、未來感與生命感，不是電競戰隊、資安公司或加密貨幣網站。

請先檢查現有專案架構，再提出簡短改造方案，然後直接實作。不要刪除現有內容、改變既有 URL，或重寫與品牌無關的功能。優先建立可重用元件、設計 token 與響應式版面。

完成後請：

- 執行 lint、typecheck、test、production build；
- 回報所有改動檔案；
- 說明 A1 與 Future B 分別放在哪裡；
- 列出仍需要我確認的文字、首頁標語或內容安排；
- 不要自行發布正式站，除非目前工作流程已明確要求部署預覽。
