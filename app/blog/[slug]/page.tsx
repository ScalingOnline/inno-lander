import {notFound} from 'next/navigation';
import {BlogArticle} from '@/components/content-pages';
import article from '@/content/reta-article.json';
export const metadata={title:'Reta, explained: INNO-3 RT research | Inno Aminos',description:article.deck};
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(slug!==article.slug)notFound();return <BlogArticle/>}
