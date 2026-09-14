# Inno Shop Bridge

This companion WordPress plugin connects the new storefront to the existing WooCommerce store without creating a second NMI billing system. It does not charge cards or place orders during the handoff. It has not been installed on the live store.

## Connection

1. Install this folder as a WordPress plugin on innoaminos.com and activate it with WooCommerce available.
2. Open WooCommerce → Inno Shop Connection. Store its generated connection secret in the storefront's server-only `INNO_WOO_BRIDGE_SECRET` environment variable. Never put it in public frontend code.
3. Configure the existing NMI gateway through WooCommerce. Native Woo checkout owns shipping, tax, stock, orders, email, and payment.
4. Configure server-only `OMNISEND_API_KEY` with contacts.write in the storefront for newsletter consent. The brand ID is not an API key.
5. Test with a gateway sandbox and live-store-equivalent shipping/tax settings before accepting payments, then configure shop.innoaminos.com.

The researcher popup is a signed 30-day self-attestation, not independent identity verification. It uses `RESEARCHER_GATE_SECRET`, configured separately for the deployed preview.

## Subscriptions are a required separate compatibility step

The frontend has all requested monthly/quarterly choices and calculations. The bridge intentionally rejects a recurring checkout until the installed subscription extension has a reviewed adapter registered with `inno_shop_subscription_adapter`. A generic NMI single-payment token does not implement renewals.

The filter receives null, source product ID, plan (`monthly` or `quarterly`), and quantity. It must return `['validated' => true, 'cart_item_data' => [...real extension purchase-plan data...]]` only after validating that the exact source product supports the real configured plan. It must preserve the product ID/inventory. Monthly is interval 1 month; quarterly is interval 3 months. Do not implement the adapter by setting only the validated flag, copying these placeholders, or scheduling an independent NMI recurring plan.

Inspect the installed subscription extension and NMI gateway first. Validate the resulting native cart's billing interval, recurring total, automatic renewal token, cancellation, failed-payment handling, gift inclusion, and shipping rates. The adapter must put one zero-priced Amino BAC Water line into each qualifying recurring shipment before shipping is quoted, apply the agreed recurring discounts, preserve contracted renewal prices, and update gift eligibility when subscription quantities change. The generic bridge does not create or modify subscriptions. Keep recurring checkout blocked until this is complete.

## Offer behavior

Canonical IDs and regular prices come from WooCommerce at checkout. Frontend display prices refresh from the signed catalog endpoint on load and tab focus after the bridge is connected; before connection the verified snapshot is used. WooCommerce confirms final stock and prices at checkout. The bridge accepts choices, never client-submitted prices. Discounts do not compound; unit prices round to cents before quantity multiplication, matching the frontend. Peptides on each delivery schedule count together. BAC does not count toward the tiers. An explicitly selected $10 BAC add-on is one-time; a qualifying 3+ shipment replaces that add-on with a free BAC line. Coupons are prevented from stacking on these promotional peptide carts.

The main store's original product names and standard cart behavior remain in place outside bridge-created carts. In bridge carts, labels become Amino BAC Water and The Wolverine Pack. The latter is the existing single blend vial, not a two-vial bundle.

## Security and privacy

Cloudflare-to-WordPress calls use HMAC over timestamp, nonce, method, route, and exact body. Requests expire after 5 minutes and replay nonces are rejected. Checkout URLs contain only opaque short-lived tickets, not addresses, email, or Cart-Tokens. A ticket can be redeemed once through a browser POST from an exact allowed shop Origin; opening a ticket URL cannot replace a cart. Redemption initializes that visitor's native Woo session, replaces that session's cart with the selected shop bag, and redirects to native checkout. Availability is rechecked when redeeming the ticket. If an item cannot be added, the previous WooCommerce bag is restored. Missing required gifts block checkout. No order is created by the handoff itself. Eligibility, Terms and MTA acknowledgements are recorded only on bridge orders, expire in the checkout session after 24 hours, and are cleared after order processing. The researcher browser cookie is independent.

Retain the WordPress scheduled cleanup mechanism and normal security updates. Never log shared secrets, request bodies, card details or checkout tickets. The integration sends contact messages through the existing wp_mail transport; verify that transport's delivery configuration.

## Validation before launch

The frontend build and local validation can be tested without production writes. The WordPress hooks and NMI/subscription lifecycle need integration testing on the actual installed stack. Test tax-inclusive pricing settings, unavailable gifts, changing quantities, cart removal, non-stacking discounts, coupon attempts, duplicate handoffs, available stock, shipping methods, research/MTA acknowledgement and email delivery. Do not describe this package as a connected or verified live payment integration before those checks are complete.

## Separate offer storefronts

Each storefront sends its server-selected `offer` inside the signed handoff payload. `shop` retains subscriptions and its original quantity tiers. `box` accepts 1–5 one-time peptide vials at 15/20/30/35/40% and includes free BAC with 3+. `get` accepts exactly one product/size, quantity 2 (second half price) or 3 (third free), without other discounts. `rt` accepts one INNO-3 RT size with 15/20/30% quantity savings. `get` and `rt` offer paid optional BAC for $10 at all quantities.

Install the updated companion plugin before connecting the three new storefronts. Add the same Woo bridge secret as a production secret on each Site. Storefront cart state is separate by origin and offer. The 4- and 5-item box tiers are draft commercial rates; check product margins before accepting paid orders. Configure the custom domain DNS separately.
