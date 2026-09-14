'use client';
import {createContext} from 'react';
import {Plus,Minus} from 'lucide-react';
import {Line} from '@/lib/catalog';
export const CartContext=createContext<{lines:Line[];loaded:boolean;bacAddon:boolean;setBacAddon:(v:boolean)=>void;add:(lines:Line[])=>void;open:()=>void;close:()=>void;updateQuantity:(line:Line,n:number)=>void;removeLine:(line:Line)=>void}>({lines:[],loaded:false,bacAddon:false,setBacAddon:()=>{},add:()=>{},open:()=>{},close:()=>{},updateQuantity:()=>{},removeLine:()=>{}});
export function Quantity({value,onChange,min=1}:{value:number;onChange:(n:number)=>void;min?:number}){return <div className="quantity"><button aria-label="Decrease quantity" disabled={value<=min} onClick={()=>onChange(value-1)}><Minus size={14}/></button><span aria-live="polite">{value}</span><button aria-label="Increase quantity" disabled={value>=99} onClick={()=>onChange(value+1)}><Plus size={14}/></button></div>}
