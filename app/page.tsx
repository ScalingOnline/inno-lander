import {GetLanding} from '@/components/get-storefront';
import {RTLanding} from '@/components/rt-storefront';
import {Homepage} from '@/components/storefront';
import {BoxLanding} from '@/components/focused-storefront';
import {storeMode} from '@/lib/store-config';
export default function Home(){return storeMode==='shop'?<Homepage/>:storeMode==='box'?<BoxLanding/>:storeMode==='rt'?<RTLanding/>:<GetLanding/>}
