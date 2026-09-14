import {Homepage} from '@/components/storefront';
import {BoxLanding,OfferLanding} from '@/components/focused-storefront';
import {storeMode} from '@/lib/store-config';
export default function Home(){return storeMode==='shop'?<Homepage/>:storeMode==='box'?<BoxLanding/>:<OfferLanding/>}
