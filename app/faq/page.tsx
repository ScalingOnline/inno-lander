import {FaqPage} from '@/components/site-extras';
import {FocusedFaq} from '@/components/focused-storefront';
import {storeMode} from '@/lib/store-config';
export const metadata={title:'FAQ | Inno Aminos'};
export default function Page(){return storeMode==='shop'?<FaqPage/>:<main id="main-content"><FocusedFaq/></main>}
