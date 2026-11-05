# Architecture rules
- Solar PDF export prints a snapshot of the rendered report and SVG charts in an isolated document, without recalculating values, to keep screen and paper consistent.
- Optional solar roof previews have an error boundary so a failed media download cannot interrupt lead capture or calculations.
- Manual Actualité publication uses a shared explicit newsletter-choice dialog; keep publication success independent from email outcomes.
- Article email analytics use a super_admin-only RPC and latest-message deduplication; never query recipient PII directly in the client.
- Newsletter broadcasts must use a dedicated marketing provider, not Lovable app-email infrastructure; requests remain visibly blocked until connected.