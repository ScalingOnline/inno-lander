# Inno Aminos shop

The storefront is a review build; no payment processor, stock service, order service or recurring billing is connected. Product prices and official images were checked on 2026-09-14. A private review deployment is separate from shop.innoaminos.com.

## Offer decisions
- Discounts replace one another and apply to regular product prices.
- Quantity counts peptide vials within each delivery schedule; different sizes and compounds can mix. BAC is excluded from tier counts.
- One-time discounts: 15%, 20%, 30% for 1, 2, 3+ items. Monthly: 20%, 25%, 35%. Every three months: 30%, 35%, 40%.
- A quarterly subscription delivers and bills the selected quantity every three months, not monthly and not three shipments prepaid. Confirm this commercial interpretation before connecting recurring billing.
- One free BAC 10 mL per shipment with 3+ eligible peptide vials, including subscriptions. This prevents subscription offers from losing the one-time gift benefit.
- For a cart without a free gift, an explicitly selected one-time BAC add-on costs $10 against $19.99 standalone, saving $9.99. It does not renew.
- Discounted unit prices round to cents before quantity multiplication throughout the site. Integrate the commerce backend with the same policy or update all display calculations together.
- The three-vial option is the default PDP selection, labeled Popular Pick as the proposed merchandising treatment. No customer reviews, timers or inventory claims are fabricated.
- /subscription routes into Build a Box with monthly selected; each peptide PDP offers subscriptions directly.

## Required before accepting orders
The native product pages, bag drawer, full cart, address step and checkout review are built. Server routes require a signed researcher cookie and explicit purchase acknowledgements. The payment step hands off to native WooCommerce using the included signed bridge when installed and configured; it is deliberately unavailable until then. No orders, payments, newsletter subscriptions, or contact messages were submitted during development.

Install integrations/inno-shop-bridge on the real WordPress store, securely configure matching INNO_WOO_BRIDGE_SECRET, connect OMNISEND_API_KEY with contacts.write, and validate the existing NMI gateway. The actual installed subscription extension must be identified and its purchase-plan adapter implemented and tested before accepting recurring orders. The bridge currently rejects recurring checkout. Configure cancellation/account management with that extension. The gateway is therefore not the only remaining production connection.

Before connection, display prices use the catalog snapshot checked on 2026-09-14. Once connected, the storefront refreshes prices and availability from the signed catalog endpoint on load and tab focus. WooCommerce rechecks authoritative regular prices and stock at checkout. Validate gift/product margins and shipping/tax settings, then connect shop.innoaminos.com. Ads and conversion analytics are not connected.

## Validation
TypeScript and the production build passed. Local checks exercised signed eligibility cookies, consent, expiry, cross-origin rejection, checkout validation, unavailable-service safeguards, mixed delivery schedules, BAC exclusions and gift thresholds. All six COA asset sets exist. The PHP bridge passed syntax parsing and a source review; it has not run against the actual WooCommerce/NMI stack. Browser visual QA and WebMCP runtime validation were not run in this flow. Published lab-report links are sample reports, not confirmation of the currently fulfilled lot.

## Pages and content

Header uses only the official mark. Product labels are Amino BAC Water and The Wolverine Pack. The latter still refers to the existing single blend vial. Every product has a tabbed COA modal; analytical reports are separate from product imagery. /subscription redirects into the monthly box builder and each peptide page includes subscribe-and-save.

The researcher entry popup is a 21+ and qualified-researcher self-attestation with four explicit confirmations, persisted by a signed HttpOnly cookie for 30 days. It is not independent identity verification. Privacy, terms and contact remain accessible before entry.

Rebuilt /why-us, /faq, /privacy-policy, /terms-conditions and /contact from the user's published pages. The contact hours follow the footer's 9 AM–5 PM listing, correcting the source page's apparent 5 AM typo. Published policies have existing inconsistencies (FAQ case-by-case refunds vs terms no cash refunds; shipping and claim-window differences) that should be reconciled by the merchant before launch. Source policy text is retained, not replaced with a new legal template.

/blog contains one original research article at /blog/reta-retatrutide-research-and-batch-analysis with primary-source links and a final INNO-3 RT CTA. It contains no dosing, preparation instructions, human-use sales claims or fabricated testimonials.

## Navigation follow-up — 2026-09-14

Replaced the portal-based researcher popup and manual storefront inert wrapper with a native modal dialog. Native close/unmount releases the page automatically. Verification requests have bounded timeouts and successful entry requires an explicit verified response. Server-side signed-cookie checks remain in place.

Browser navigation checked in the supervised local preview: confirm entry, home → INNO-3 RT, COA tabs and close, add three vials, bag → full cart → checkout, Build a Box and Journal. Product and cart interactions remained available after closing overlays. The live Site is published separately; no live orders or emails were submitted.
