'use client';

import {useContext, useEffect, useState} from 'react';
import {ArrowRight, Check, FileCheck2, FlaskConical, Gift, RotateCw, ShieldCheck, ShoppingBag, Truck, Users} from 'lucide-react';
import {discounted, money, Plan, priceCart, rate} from '@/lib/catalog';
import {CartContext, Quantity} from './cart-context';
import {useCatalog} from './catalog-context';
import {BacOption, FocusedFaq, Standards} from './focused-storefront';
import {COAViewer} from './site-extras';
import {RadioGroup, RadioGroupItem} from './ui/radio-group';

function Bottle({className = '', alt = ''}: {className?: string; alt?: string}) {
  return <span className={'rt-bottle ' + className}><img src="/products/inno-3-rt.png" alt={alt}/></span>;
}

export function RTLanding() {
  const catalog = useCatalog(), ctx = useContext(CartContext);
  const [variant, setVariant] = useState(0);
  const [quantity, setQuantity] = useState(3);
  const [plan, setPlan] = useState<Plan>('monthly');
  const product = catalog.find(p => p.slug === 'inno-3-rt')!;
  const bac = catalog.find(p => p.accessory)!;
  const base = product.variants[variant].price;
  const percent = rate(quantity, plan), unit = discounted(base, percent);
  const selection = {slug: product.slug, variant, quantity, plan};
  const cart = priceCart([selection], ctx.bacAddon, catalog);
  const freeGift = cart.gifts.length > 0;

  useEffect(() => {
    const saved = ctx.lines[0];
    if (ctx.loaded && saved) {
      setVariant(saved.variant);
      setQuantity(saved.quantity);
      if (new URLSearchParams(window.location.search).get('edit') === 'bag') setPlan(saved.plan);
    }
  }, [ctx.loaded]);

  return <main id="main-content" className="rt-landing">
    <section className="focus-hero offer-intro rt-intro">
      <span className="glass-pill"><FlaskConical size={15}/> BEST SELLING · GLP-3</span>
      <h1>More research.<br/><em>Less per bottle.</em></h1>
      <p>Your research favorite, on your schedule. Subscribe monthly and save up to 40%.</p>
      <div className="rt-trust"><Users size={18}/><strong>Trusted by 5,000+ Researchers</strong></div>
      <div className="focus-hero-proof"><span><FileCheck2 size={15}/> Published COAs</span><span><ShieldCheck size={15}/> Research use only</span><span><Check size={15}/> No code needed</span></div>
    </section>

    <section className="focus-offer-purchase" id="purchase">
      <div className="focus-offer-layout">
        <div className="focus-offer-visual rt-product-visual">
          <div className="focus-visual-top"><span className="glass-pill">BEST SELLING</span><span>{product.variants[variant].name} / bottle</span></div>
          <div className="rt-bottle-stage">
            <div className="offer-halo"/>
            {quantity > 1 && <Bottle className="rt-back-left"/>}
            {quantity >= 3 && <Bottle className="rt-back-right"/>}
            <Bottle className="rt-front" alt={`GLP-3, ${product.variants[variant].name} research vial`}/>
          </div>
          <div className="rt-visual-gift"><Gift size={18}/>{freeGift ? 'Your free BAC gift is unlocked' : 'Choose 3+ vials to unlock your free gift'}</div>
          <div className="focus-visual-footer"><span><FlaskConical size={15}/> Laboratory research only</span><span><FileCheck2 size={15}/> COAs available</span></div>
        </div>

        <div className="focus-offer-config rt-config">
          <span className="eyebrow">BEST SELLING RESEARCH PEPTIDE</span>
          <h2>{product.name}</h2>
          <p>Choose your bottle size, delivery schedule, and quantity. Your savings apply automatically.</p>
          <div className="focus-field"><strong>Choose your vial size</strong><div className="focus-sizes" role="group" aria-label="GLP-3 vial size">{product.variants.map((v, i) => <button key={v.name} className={variant === i ? 'selected' : ''} aria-pressed={variant === i} onClick={() => setVariant(i)}>{v.name}</button>)}</div></div>

          <div className="focus-field rt-purchase-type">
            <strong>Choose your delivery</strong>
            <RadioGroup value={plan} onValueChange={v => setPlan(v as 'once' | 'monthly')} aria-label="Purchase type" className="rt-plan-options">
              <label className={plan === 'monthly' ? 'selected' : ''}><RadioGroupItem value="monthly" id="rt-monthly"/><span><strong><RotateCw size={16}/> Subscribe & Save</strong><small>Delivered every month</small></span><b>{rate(quantity, 'monthly')}% OFF</b></label>
              <label className={plan === 'once' ? 'selected' : ''}><RadioGroupItem value="once" id="rt-once"/><span><strong>One-time purchase</strong><small>Order when you need it</small></span><b>{rate(quantity, 'once')}% OFF</b></label>
            </RadioGroup>
          </div>

          <div className="focus-field"><strong>Buy more. Save more.</strong>
            <div className="focus-offer-options three rt-bundle-options" role="group" aria-label="Choose quantity">{[1, 2, 3].map(n => <button key={n} className={(Math.min(quantity, 3) === n ? 'selected ' : '') + (n === 3 ? 'best' : '')} aria-pressed={Math.min(quantity, 3) === n} onClick={() => setQuantity(n)}>
              {n === 3 && <span className="size-ribbon">POPULAR PICK</span>}
              <span className="rt-option-bottles">{Array.from({length: n}, (_, i) => <Bottle key={i}/>)}</span>
              <strong>Buy {n === 3 ? '3+' : n}</strong><b>{rate(n, plan)}% OFF</b>
              <span>{money(discounted(base, rate(n, plan)) / parseFloat(product.variants[variant].name))} / mg</span>
              {n === 3 && <small className="rt-option-gift"><Gift size={13}/> FREE GIFT</small>}
            </button>)}</div>
            {quantity >= 3 && <div className="extra-quantity"><span>Your bundle quantity</span><Quantity value={quantity} min={3} onChange={setQuantity}/></div>}
          </div>

          <div className="focus-price rt-unit-price" aria-live="polite"><strong>{money(unit)}</strong><small>/ bottle</small><s>{money(base)}</s><span>You save {money(cart.savings)} on {quantity} {quantity === 1 ? 'vial' : 'vials'}</span></div>

          {freeGift ? <div className="rt-free-gift"><img src={bac.image} alt="Amino BAC Water, 10 mL"/><div><span><Gift size={14}/> FREE GIFT UNLOCKED</span><strong>Amino BAC Water</strong><small>10 mL · {plan === 'monthly' ? 'Included with every 3+ vial monthly shipment' : 'Included with your 3+ vial order'}</small></div><div><b>FREE</b><s>{money(bac.variants[0].price)}</s></div></div> : <><p className="rt-gift-nudge"><Gift size={16}/> Add {3 - quantity} more {quantity === 2 ? 'vial' : 'vials'} to unlock your free BAC gift.</p><BacOption checked={ctx.bacAddon} setChecked={ctx.setBacAddon}/></>}

          <button className="btn focus-add" disabled={product.variants[variant].available === false} onClick={() => ctx.add([selection])}><ShoppingBag size={18}/>{product.variants[variant].available === false ? 'Currently unavailable' : `Add Offer to Bag · ${money(cart.subtotal)}`}<ArrowRight size={18}/></button>
          <p className="focus-note rt-renewal-note">{quantity} × {product.variants[variant].name} · {plan === 'monthly' ? <>{money(unit * quantity)} in products renews every month.</> : 'One-time purchase.'}<br/>Shipping and tax calculated at checkout.{cart.addon > 0 && <><br/>The $10 BAC add-on is for this order only.</>}</p>
          {ctx.lines.length > 0 && <button className="text-link rt-open-bag" onClick={ctx.open}>View your bag <ArrowRight size={15}/></button>}
          <COAViewer product={product} variant={variant}/>
          <div className="focus-mini-service"><span><Truck size={16}/> Ships in 1–2 business days</span><span><ShieldCheck size={16}/> Research use only</span></div>
        </div>
      </div>
    </section>
    <section className="focus-product-detail"><span className="glass-pill"><FlaskConical size={15}/> GLP-3</span><h2>Your research. Well supplied.</h2><p>{product.details}</p><COAViewer product={product} variant={variant}/></section>
    <Standards/><FocusedFaq/>
  </main>;
}
