# Architecture rules
- Header, mobile menu and footer section links use the shared navigation resolver and configured homepage anchors to prevent viewport-specific broken destinations.
- Solar PDF export prints a snapshot of the rendered report and SVG charts in an isolated document, without recalculating values, to keep screen and paper consistent.
- Optional solar roof previews have an error boundary so a failed media download cannot interrupt lead capture or calculations.
- Manual Actualité publication uses a shared explicit newsletter-choice dialog; keep publication success independent from email outcomes.
- Article email analytics use a super_admin-only RPC and latest-message deduplication; never query recipient PII directly in the client.
- Newsletter broadcasts must use a dedicated marketing provider, not Lovable app-email infrastructure; requests remain visibly blocked until connected.
- Solar simulation references identify immutable engine snapshots; a separate hashed capability links contacts, while only super_admin RPCs read private reports, without recalculation.
- Homepage metadata is resolved from public general settings by the Vite HTML transform and embedded as an immutable snapshot consumed by Helmet; fail publication on unreadable settings to prevent first-load drift and mark owned head tags for deduplication.