# Architecture rules
- Manual Actualité publication uses a shared explicit newsletter-choice dialog; keep publication success independent from email outcomes.
- Article email analytics use a super_admin-only RPC and latest-message deduplication; never query recipient PII directly in the client.
- Newsletter broadcasts must use a dedicated marketing provider, not Lovable app-email infrastructure; requests remain visibly blocked until connected.