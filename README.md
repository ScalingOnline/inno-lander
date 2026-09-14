# Inno Aminos storefronts

The updated site for Inno focusing on core products. This repository contains the complete shared source for the shop, box, promotional, and INNO-3 RT storefronts: responsive pages, product photography, COA viewer, researcher gate, persistent carts, checkout forms, content pages, and the companion WooCommerce plugin.

## Storefronts

| Mode | Intended domain | Offer |
| --- | --- | --- |
| `shop` (default) | shop.innoaminos.com | Product pages; one-time and monthly/quarterly subscriptions |
| `box` | box.innoaminos.com | Mix 1–5 peptide vials; 15/20/30/35/40% savings; free BAC with 3+ |
| `get` | get.innoaminos.com | Mix any 2 vials: cheaper vial half price; any 3 vials: cheapest vial free |
| `rt` | rt.innoaminos.com | GLP-3; one-time saves 15/20/30%; monthly saves 25/30/40%; free BAC at 3+ |

The 4- and 5-vial box discounts are proposed commercial rates and require margin review before paid launch. New subdomain DNS is not configured by this repository.

## Run locally

Requires Node.js >=22.13.0 and the pnpm version declared in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
node scripts/select-storefront.mjs shop
pnpm dev
```

Replace `shop` with `box`, `get`, or `rt` before starting or building. The script changes `lib/store-config.ts`, so both server validation and the client use the same offer. Build each subdomain separately. Stop the dev server before switching modes.

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

Create an ignored `.dev.vars` file for local Cloudflare bindings using the names in `.env.example`. Set a random `RESEARCHER_GATE_SECRET` of at least 32 bytes. The gate intentionally requires its signing secret. Leave the WooCommerce and Omnisend values unset until the real services are configured. Never commit secrets or put them in browser-visible variables.

## Current behavior

- Main peptide product pages default to Subscribe & Save, Monthly, Buy 1. BAC Water is one-time only.
- Bundle cards read Buy 1, Buy 2, Buy 3+, emphasize the discount, and show discounted price per mg. The amount payable remains beside the add-to-bag button.
- The researcher self-attestation lasts 30 days in the same browser, using a signed receipt with cookie/storage fallback. It does not repeat on each page. Separate subdomains have independent verification and carts.
- RT displays GLP-3, Best Selling, and Trusted by 5,000+ Researchers, as supplied by the owner. It defaults to monthly, shows the bottle price prominently and full order total on the CTA, and unlocks a free BAC gift at 3+ vials. Paid BAC on smaller orders is one-time only.
- GET supports mixed products and strengths within each two- or three-vial offer. One discount applies to the lowest-priced vial; duplicates are supported.
- Build a Box is removed from the shop navigation; the dedicated box storefront owns that flow.
- COAs open in a tabbed dialog and are separate from the product photos.
- Product pages, cart, checkout, footer pages, and the first research article are included.

## Backend connection still required

This is a Vinext/Next-compatible React application with Cloudflare Worker API routes. Payment and recurring billing are not connected or verified. The checkout form prepares a signed handoff to the existing WooCommerce checkout, where the NMI gateway handles payment.

Install and configure [Inno Shop Bridge](integrations/inno-shop-bridge/README.md). Its source and installable ZIP are included. Configure `INNO_WOO_BRIDGE_SECRET` and `OMNISEND_API_KEY` on the server. Subscription checkout stays blocked until a reviewed adapter for the actual WooCommerce subscription extension and NMI gateway is installed. The service configuration is more than adding a frontend payment key.

The GitHub export omits the existing Sites project identity and all secrets. It preserves the application and build configuration for development. Hosting on a different platform requires that platform's runtime setup. See [starter/build details](docs/STARTER.md).

## Continuing in Lovable

This source has been exported to GitHub; that alone does not connect it to Lovable. Lovable's official documentation currently does not support importing arbitrary existing GitHub repositories. It creates a repository when a Lovable project is connected, then syncs changes with that linked repository.

The current Vinext/Cloudflare application also needs adaptation to the actual Lovable project's framework and server runtime. Follow [LOVABLE_HANDOFF.md](LOVABLE_HANDOFF.md). Do not assume that copying the repository creates a working Lovable deployment.

## Source map

- `components/storefront.tsx`: main shop and product purchase flow
- `components/focused-storefront.tsx`: box flow, shared cart, and FAQs
- `components/rt-storefront.tsx`, `components/get-storefront.tsx`: GLP-3 subscriptions and mixed promotional offers
- `lib/catalog.ts`, `lib/commerce.ts`: offer calculations and server validation
- `app/api/`: researcher verification, catalog, checkout, newsletter, contact
- `components/site-extras.tsx`: researcher modal and COA viewer
- `content/`, `public/`: article, policies, COA reports, product images, fonts
- `integrations/inno-shop-bridge/`: authoritative WooCommerce integration

Frontend production builds passed for all four storefront modes. Offer calculations and quantity validation were checked, including odd-cent BOGO prices, mixed boxes, and BAC eligibility. Researcher persistence, expiry, tampering, and protected endpoints were checked locally. Real WooCommerce/NMI, renewal, email delivery, and DNS checks remain deployment work.
