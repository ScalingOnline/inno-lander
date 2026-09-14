import {CartPage} from '@/components/site-extras';
import {FocusedCart} from '@/components/focused-storefront';
import {storeMode} from '@/lib/store-config';
export const metadata={title:'Your Bag | Inno Aminos'};
export default function Page(){return storeMode==='shop'?<CartPage/>:<FocusedCart/>}
