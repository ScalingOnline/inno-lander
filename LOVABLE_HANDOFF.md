# Lovable handoff

## Connection requirement

As checked September 14, 2026, [Lovable's GitHub guide](https://docs.lovable.dev/integrations/github) says an arbitrary existing GitHub repository cannot be imported. A Lovable project creates a new repository when connected. External commits to that connected repository can sync back through its active branch.

Create a Lovable project, connect it to GitHub from Lovable, and use its actual linked repository for the migration. Preserve the generated framework and configuration instead of overwriting them with this repository's build setup. Do not rename repositories to attempt to bypass the documented connection workflow.

## Framework and runtime

[Lovable's FAQ](https://docs.lovable.dev/introduction/faq) states that new apps since May 13, 2026 use TanStack Start with server-side rendering, while older projects use React and Vite. Inspect the target project's package.json and routes before porting.

This source uses Vinext's Next-compatible App Router and `cloudflare:workers` bindings. Git synchronization alone does not make that runtime compatible with a Lovable template. Port React components, CSS, catalog data, images, and content into the target framework. Adapt `next/link`, `next/navigation`, page layouts, metadata, and route parameters to its router. Preserve ordinary page links and direct URL navigation.

## Required migration behavior

1. Keep all product, cart, checkout, blog, footer, and legal routes usable on direct load and navigation. Use the logo by itself in the header and preserve the centered page frame.
2. Keep `shop`, `box`, `get`, and `rt` as distinct server-selected offer profiles. Never let a client request choose an unauthorized pricing profile. Build separate storefronts with isolated carts.
3. Preserve the product names Amino BAC Water and The Wolverine Pack, the tabbed COA dialog, and COAs outside the product gallery.
4. Preserve Buy 1/2/3+ cards with large discounts and price per mg, plus actual payable totals near the CTA. Main product pages default to Monthly Subscribe & Save and Buy 1.
5. Port researcher signing and verification server-side. Preserve the 30-day signed receipt, its original expiration, browser persistence, cookie fallback, tamper rejection, and server protection of checkout/newsletter. Do not replace this with an unsigned localStorage boolean. The popup is self-attestation, not third-party identity verification.
6. Port `/api/catalog`, `/api/commerce/status`, `/api/commerce/checkout`, `/api/researcher`, `/api/contact`, and `/api/newsletter` to the target server runtime. Keep HMAC signatures and all API keys server-side. Use same-origin endpoints or explicitly reviewed origin handling.
7. Keep final pricing, coupon non-stacking, stock, BAC gifts, tax, shipping, orders, and NMI billing authoritative in WooCommerce. Preserve the signed handoff protocol. Keep disconnected services and unsupported recurring plans blocked honestly.
8. Configure the WooCommerce bridge, subscription adapter, Omnisend, and runtime secrets. Verify actual sandbox checkout/renewal and delivery behavior before live payment acceptance.

## Pricing to preserve

| Profile | Quantity | Discount / offer | BAC |
| --- | --- | --- | --- |
| Shop one-time | 1 / 2 / 3+ | 15 / 20 / 30% | Free at 3+, otherwise optional $10 |
| Shop monthly | 1 / 2 / 3+ | 20 / 25 / 35% | Free at 3+ in that shipment |
| Shop quarterly | 1 / 2 / 3+ | 30 / 35 / 40% | Free at 3+ in that shipment |
| Box | 1 / 2 / 3 / 4 / 5 | 15 / 20 / 30 / 35 / 40% | Free at 3+, otherwise optional $10 |
| Get | 2 / 3 matching vials | Second half-price / third free | Optional $10 |
| RT | 1 / 2 / 3+ | 15 / 20 / 30% | Optional $10 at all quantities |

Discounts do not stack. BAC does not count toward peptide tiers. GET quantity 2 costs one base vial plus a second vial rounded to half-price in cents; quantity 3 costs exactly two base vials. Other percentage offers round each discounted unit to cents before multiplication. Main shop counts peptide quantities separately for each delivery schedule.
