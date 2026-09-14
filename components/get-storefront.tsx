'use client';

import {useContext, useEffect, useState} from 'react';
import {ArrowRight, Check, FileCheck2, FlaskConical, ShieldCheck, ShoppingBag, Truck} from 'lucide-react';
import {Line, money, priceCart} from '@/lib/catalog';
import {CartContext} from './cart-context';
import {useCatalog} from './catalog-context';
import {FocusedFaq, Standards} from './focused-storefront';
import {COAViewer} from './site-extras';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from './ui/select';

type Pick = {slug: string; variant: number};
const firstPick = (): Pick => ({slug: 'inno-3-rt', variant: 0});
function linesFor(picks: Pick[]): Line[] {
  const lines: Line[] = [];
  for (const pick of picks) {
    const existing = lines.find(l => l.slug === pick.slug && l.variant === pick.variant);
    if (existing) existing.quantity++;
    else lines.push({...pick, quantity: 1, plan: 'once'});
  }
  return lines;
}

export function GetLanding() {
  const catalog = useCatalog(), ctx = useContext(CartContext);
  const [picks, setPicks] = useState<Pick[]>([firstPick(), firstPick(), firstPick()]);
  const [active, setActive] = useState(0);
  const quantity = picks.length;
  const lines = linesFor(picks), cart = priceCart(lines, ctx.bacAddon, catalog);
  const activeProduct = catalog.find(p => p.slug === picks[active].slug)!;
  const slotCart = priceCart(picks.map(p => ({...p, quantity: 1, plan: 'once'})), false, catalog);
  useEffect(() => {
    if (ctx.loaded && ctx.lines.length) {
      const restored = ctx.lines.flatMap(l => Array.from({length: l.quantity}, () => ({slug: l.slug, variant: l.variant})));
      if (restored.length >= 1 && restored.length <= 3) {setPicks(restored.length === 1 ? [...restored, firstPick()] : restored); setActive(0);}
    }
  }, [ctx.loaded, ctx.lines]);
  function updatePick(index: number, pick: Pick) {setPicks(items => items.map((p, i) => i === index ? pick : p)); setActive(index);}
  function selectQuantity(n: number) {setPicks(items => n === 2 ? items.slice(0, 2) : items.length === 3 ? items : [...items, firstPick()]); setActive(i => Math.min(i, n - 1));}
  const unavailable = picks.some(p => catalog.find(product => product.slug === p.slug)?.variants[p.variant].available === false);

  return <main id="main-content" className="get-landing">
    <section className="focus-hero offer-intro get-intro"><span className="glass-pill"><FlaskConical size={15}/> A LITTLE EXTRA GOES A LONG WAY</span><h1>Good things<br/><em>come in threes.</em></h1><p>Mix your research favorites. Take 50% off your second vial—or make your third one free.</p><div className="focus-hero-proof"><span><Check size={15}/> Mix products & sizes</span><span><FileCheck2 size={15}/> Published COAs</span><span><ShieldCheck size={15}/> Research use only</span></div></section>

    <section className="focus-offer-purchase" id="purchase">
      <div id="collection" className="offer-product-picker"><div className="focus-step"><span>PICK A FAVORITE FOR VIAL {active + 1}</span><p>Choose any product below, or change each vial in your mix.</p></div><div role="group" aria-label={`Choose product for vial ${active + 1}`}>{catalog.filter(p => !p.accessory).map(p => <button key={p.slug} className={activeProduct.slug === p.slug ? 'selected' : ''} aria-pressed={activeProduct.slug === p.slug} onClick={() => updatePick(active, {slug: p.slug, variant: 0})}><img src={p.image} alt=""/><span>{p.name}{p.slug === 'klow' ? ' 80 mg' : ''}</span>{activeProduct.slug === p.slug && <Check size={16}/>}</button>)}</div></div>

      <div className="focus-offer-layout">
        <div className="focus-offer-visual"><div className="focus-visual-top"><span className="glass-pill">YOUR FAVORITES. BETTER TOGETHER.</span><span>{quantity} vial offer</span></div><div className="offer-vial-stage"><div className="offer-halo"/>{picks.map((pick, i) => {const p = catalog.find(p => p.slug === pick.slug)!; return <img key={i} className={'offer-vial ' + (i === 0 ? 'front' : i === 1 ? 'back-left' : 'back-right')} src={p.image} alt={`${p.name}, ${p.variants[pick.variant].name}`}/>;})}<span className="free-vial-sticker">{quantity === 3 ? <>3RD VIAL<br/><b>FREE</b></> : <>2ND VIAL<br/><b>50% OFF</b></>}</span></div><div className="get-visual-picks">{picks.map((pick, i) => <button key={i} className={i === active ? 'selected' : ''} onClick={() => setActive(i)}><span>{i + 1}</span>{catalog.find(p => p.slug === pick.slug)!.name}</button>)}</div><div className="focus-visual-footer"><span><FlaskConical size={15}/> Laboratory research only</span><span><FileCheck2 size={15}/> COAs available</span></div></div>

        <div className="focus-offer-config get-mix-config"><span className="eyebrow">YOUR PICKS. YOUR OFFER.</span><h2>Your research mix.</h2><p>Different products, different sizes, or more of your favorite. Every vial is your choice.</p>
          <div className="focus-field"><strong>Choose your offer</strong><div className="focus-offer-options two" role="group" aria-label="Choose offer">{[2, 3].map(n => <button key={n} className={(quantity === n ? 'selected ' : '') + (n === 3 ? 'best' : '')} aria-pressed={quantity === n} onClick={() => selectQuantity(n)}>{n === 3 && <span className="size-ribbon">BEST VALUE</span>}<span className="offer-option-icons">{Array.from({length: n}, (_, i) => <img key={i} src={catalog.find(p => p.slug === (picks[i]?.slug || 'inno-3-rt'))!.image} alt=""/>)}</span><strong>{n === 2 ? 'Buy 1, get 1 50% off' : 'Buy 2, get 1 free'}</strong><b>{n} vials · Mix & match</b><small>{n === 2 ? 'Lower-priced vial half off' : 'Lowest-priced vial free'}</small></button>)}</div></div>

          <div className="focus-field get-mix-field"><strong>Make it your mix</strong><div className="get-mix-slots">{picks.map((pick, i) => {const p = catalog.find(p => p.slug === pick.slug)!, priced = slotCart.priced[i]; return <article key={i} className={'get-mix-slot ' + (active === i ? 'active' : '')}>
            <button className="get-slot-index" aria-label={`Select vial ${i + 1}`} aria-pressed={active === i} onClick={() => setActive(i)}>{i + 1}</button><img src={p.image} alt=""/><div className="get-slot-fields">
              <Select value={pick.slug} onValueChange={slug => updatePick(i, {slug, variant: 0})}><SelectTrigger aria-label={`Product for vial ${i + 1}`}><SelectValue/></SelectTrigger><SelectContent>{catalog.filter(p => !p.accessory).map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}{p.slug === 'klow' ? ' 80 mg' : ''}</SelectItem>)}</SelectContent></Select>
              <Select value={String(pick.variant)} onValueChange={v => updatePick(i, {...pick, variant: Number(v)})}><SelectTrigger aria-label={`Size for vial ${i + 1}`}><SelectValue/></SelectTrigger><SelectContent>{p.variants.map((v, index) => <SelectItem key={v.name} value={String(index)}>{v.name}{v.available === false ? ' · unavailable' : ''}</SelectItem>)}</SelectContent></Select>
              <COAViewer product={p} variant={pick.variant}/>
            </div><div className="get-slot-price"><strong>{priced.total === 0 ? 'FREE' : money(priced.total)}</strong>{priced.total < priced.base && <><s>{money(priced.base)}</s><small>{quantity === 3 ? 'Free vial' : '50% off vial'}</small></>}</div>
          </article>;})}</div></div>
          <p className="get-offer-rule">{quantity === 3 ? 'Your lowest-priced vial is free.' : 'Your lower-priced vial is half off.'} Discount applies automatically. BAC is excluded; offers do not stack.</p>
          <div className="focus-price" aria-live="polite"><strong>{money(cart.subtotal)}</strong><s>{money(cart.original + cart.addon)}</s><span>You save {money(cart.savings)} on {quantity} vials</span></div>
          <button className="btn focus-add" disabled={unavailable} onClick={() => ctx.add(lines)}><ShoppingBag size={18}/>{unavailable ? 'A selected vial is unavailable' : `Add Offer to Bag · ${money(cart.subtotal)}`}<ArrowRight size={18}/></button>
          <p className="focus-note">{quantity} vials · One-time purchase<br/>Shipping and tax calculated at checkout. Optional $10 BAC in your bag.</p><div className="focus-mini-service"><span><Truck size={16}/> Ships in 1–2 business days</span><span><ShieldCheck size={16}/> Research use only</span></div>
        </div>
      </div>
    </section><Standards/><FocusedFaq/>
  </main>;
}
