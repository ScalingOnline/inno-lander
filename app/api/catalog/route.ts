import {commerceConnected,wooBridge} from '@/lib/commerce';
import {products} from '@/lib/catalog';
import {json} from '@/lib/researcher';
export async function GET(){
 if(!commerceConnected())return json({connected:false});
 try{const r=await wooBridge('catalog',{});if(r.currency!=='USD'||!Array.isArray(r.products))throw new Error('Catalog unavailable.');
 const catalog=products.map(p=>{const data=r.products!.find(x=>x.slug===p.slug);if(!data||data.variants.length!==p.variants.length)throw new Error('Catalog incomplete.');return {...p,variants:p.variants.map((v,i)=>{const actual=data.variants[i];if(!Number.isInteger(actual.price)||actual.price<1||typeof actual.available!=='boolean')throw new Error('Invalid product price.');return {...v,price:actual.price,available:actual.available};})};});return json({connected:true,products:catalog});
 }catch{return json({connected:false,error:'Live catalog could not be refreshed. Final availability and prices are confirmed at checkout.'},502);}
}
