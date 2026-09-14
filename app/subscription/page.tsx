import {redirect} from 'next/navigation';
import {storeMode} from '@/lib/store-config';
export default function Page(){redirect(storeMode==='shop'?'/inno-3-rt':'/')}
