import { env } from 'cloudflare:workers';
import {RESEARCHER_MAX_AGE, RESEARCHER_TOKEN_HEADER, type ResearcherReceipt} from './researcher-session';
export const GATE_COOKIE='inno_researcher_v1';
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function key(){if(!env.RESEARCHER_GATE_SECRET)throw new Error('Verification is temporarily unavailable.');return crypto.subtle.importKey('raw',new TextEncoder().encode(env.RESEARCHER_GATE_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
export async function issueResearcherCookie(){const data=encode(new TextEncoder().encode(JSON.stringify({v:1,exp:Date.now()+RESEARCHER_MAX_AGE*1000,attestation:true})));const signature=await crypto.subtle.sign('HMAC',await key(),new TextEncoder().encode(data));return data+'.'+encode(new Uint8Array(signature))}
export async function verifyResearcherToken(value:string|null|undefined):Promise<ResearcherReceipt|null>{try{if(!value||value.length>2048)return null;const [data,sig,extra]=value.split('.');if(!data||!sig||extra)return null;const valid=await crypto.subtle.verify('HMAC',await key(),decode(sig),new TextEncoder().encode(data));if(!valid)return null;const claims=JSON.parse(new TextDecoder().decode(decode(data)));return claims.v===1&&claims.attestation===true&&Number.isFinite(claims.exp)&&claims.exp>Date.now()?{token:value,expiresAt:claims.exp}:null}catch{return null}}
export async function researcherReceipt(request:Request):Promise<ResearcherReceipt|null>{const cookie=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(GATE_COOKIE+'='))?.slice(GATE_COOKIE.length+1);return await verifyResearcherToken(request.headers.get(RESEARCHER_TOKEN_HEADER))||await verifyResearcherToken(cookie)}
export async function researcherVerified(request:Request){return !!await researcherReceipt(request)}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin}
export function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}})}
export async function smallBody(request:Request){const raw=await request.text();if(raw.length>24000)throw new Error('Request is too large.');return JSON.parse(raw)}
