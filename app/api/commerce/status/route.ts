import {commerceConnected} from '@/lib/commerce';
import {json} from '@/lib/researcher';
export async function GET(){return json({checkoutConnected:commerceConnected()})}
