import {storeMode} from '@/lib/store-config';
import {notFound,redirect} from 'next/navigation';
import {products} from '@/lib/catalog';
import {ProductPage} from '@/components/storefront';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=products.find(p=>p.slug===slug);return {title:p?`${p.name} | Inno Aminos`:'Product | Inno Aminos',description:p?.description};}
export default async function Page({params}:{params:Promise<{slug:string}>}){if(storeMode!=='shop')redirect('/#purchase');const {slug}=await params;const aliases:Record<string,string>={'klow-80mg':'klow','recon-10-ml':'reconstitution-solution','amino-bac-water':'reconstitution-solution','the-wolverine-pack':'wolverine','bac-water':'reconstitution-solution','bpc-157-tb-500-wolverine-stack':'wolverine'};if(aliases[slug])redirect('/'+aliases[slug]);const product=products.find(p=>p.slug===slug);if(!product)notFound();return <ProductPage key={product.slug} product={product}/>}
