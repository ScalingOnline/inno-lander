'use client';
import {ReactNode,useEffect,useState} from 'react';
import {ShoppingBag,ArrowRight,Menu,FlaskConical} from 'lucide-react';
import {products,Product,Line} from '@/lib/catalog';
import {storeMode} from '@/lib/store-config';
import {CartContext} from './cart-context';
import {CatalogContext} from './catalog-context';
import {Newsletter} from './site-extras';
import {FocusedCart} from './focused-storefront';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from './ui/sheet';
const storageKey='inno-'+storeMode+'-cart-v1';
function valid(value:unknown):value is Line{if(!value||typeof value!=='object')return false;const l=value as Line,p=products.find(p=>p.slug===l.slug);return !!p&&!p.accessory&&!!p.variants[l.variant]&&Number.isInteger(l.variant)&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<100&&(l.plan==='once'||(storeMode==='rt'&&l.plan==='monthly'))&&(storeMode!=='rt'||l.slug==='inno-3-rt')}
export function FocusedShell({children}:{children:ReactNode}){
 const [catalog,setCatalog]=useState<Product[]>(products),[lines,setLines]=useState<Line[]>([]),[loaded,setLoaded]=useState(false),[bac,setBac]=useState(false),[open,setOpen]=useState(false),[menu,setMenu]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(Array.isArray(saved.lines)){const ls=saved.lines.filter(valid);const n=ls.reduce((s:number,l:Line)=>s+l.quantity,0);if((storeMode!=='box'||n<=5)&&(storeMode!=='get'||n<=3))setLines(storeMode==='rt'?ls.slice(0,1):ls);}setBac(saved.bac===true)}catch{}setLoaded(true);fetch('/api/catalog',{cache:'no-store'}).then(r=>r.json() as Promise<{products?:Product[]}>).then(r=>{if(Array.isArray(r.products)&&r.products.length===products.length)setCatalog(r.products)}).catch(()=>{})},[]);
 useEffect(()=>{if(loaded)try{localStorage.setItem(storageKey,JSON.stringify({lines,bac}))}catch{}},[lines,bac,loaded]);
 const count=lines.reduce((s,l)=>s+l.quantity,0);
 const links=[['Choose your '+(storeMode==='box'?'box':'offer'),'/#purchase'],['Our standards','/#standards'],['Questions','/#questions']];
 return <div className={'focused-theme mode-'+storeMode}><CatalogContext.Provider value={catalog}><CartContext.Provider value={{lines,loaded,bacAddon:bac,setBacAddon:setBac,add:items=>{setLines(items);setOpen(true)},open:()=>setOpen(true),close:()=>setOpen(false),updateQuantity:(l,n)=>setLines(ls=>ls.map(x=>x===l?{...x,quantity:n}:x).filter(x=>x.quantity>0)),removeLine:l=>setLines(ls=>ls.filter(x=>x!==l))}}>
 {storeMode==='rt'?<header className="rt-promo-header" aria-label="One-time purchase savings"><span>Buy 1 <strong>Save 15%</strong></span><span>Buy 2 <strong>Save 20%</strong></span><span>Buy 3 <strong>Save 30%</strong></span></header>:<> <div className="announcement"><span>{storeMode==='box'?'Your box. Your picks. Up to 40% off.':storeMode==='get'?'Buy 2. Get your 3rd vial FREE.':'INNO-3 RT · Buy more. Save up to 30%.'}</span><a href="/#purchase">{storeMode==='box'?'Build your box':'Choose your offer'} <ArrowRight size={14}/></a></div>
 <header className="header"><a href="/" className="brand" aria-label="Inno Aminos home"><img src="/products/logo.svg" alt="Inno Aminos"/></a><nav className="desktop-nav">{links.map(([label,url])=><a href={url} key={url}>{label}</a>)}</nav><div className="header-actions"><button className="cart-trigger" onClick={()=>setOpen(true)} aria-label={`Open bag, ${count} items`}><ShoppingBag size={20}/><span className="bag-word">Bag</span><span className="bag-count">{count}</span></button><button className="mobile-menu icon-button" onClick={()=>setMenu(true)} aria-label="Open navigation"><Menu/></button></div></header>
</>}
 <a href="#main-content" className="skip-link">Skip to content</a>{children}<Newsletter/>
 <footer className="footer"><div className="footer-top"><div><a href="/" className="footer-brand">inno aminos<span>.</span></a><p>Research, well supplied.</p></div><div className="footer-links"><a href="/#purchase">{storeMode==='box'?'Build your box':'Shop the offer'}</a><a href="/cart">Your bag</a><a href="/why-us">Why Inno Aminos</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div></div><div className="research-notice"><FlaskConical size={20}/><p><strong>For laboratory research use only.</strong> Not for human or animal use. Not for therapeutic or diagnostic applications.</p></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Inno Amino LLC</span><div><a href="/privacy-policy">Privacy Policy</a><a href="/terms-conditions">Terms & Conditions</a></div><span>United States · USD $</span></div></footer>
 <Sheet open={open} onOpenChange={setOpen}><SheetContent className="cart-sheet"><SheetHeader><SheetTitle>Your research bag</SheetTitle><SheetDescription>Your selected offer, with savings already applied.</SheetDescription></SheetHeader><FocusedCart drawer/></SheetContent></Sheet>
 <Sheet open={menu} onOpenChange={setMenu}><SheetContent><SheetHeader><SheetTitle>Explore Inno Aminos</SheetTitle><SheetDescription>Research, well supplied.</SheetDescription></SheetHeader><nav className="mobile-nav">{links.map(([label,url])=><a href={url} key={url} onClick={()=>setMenu(false)}>{label}<ArrowRight/></a>)}</nav></SheetContent></Sheet>
 </CartContext.Provider></CatalogContext.Provider></div>
}
