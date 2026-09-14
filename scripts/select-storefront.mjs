import {readFileSync, writeFileSync} from 'node:fs';

const mode = process.argv[2];
if (!['shop', 'box', 'get', 'rt'].includes(mode)) {
  console.error('Usage: node scripts/select-storefront.mjs shop|box|get|rt');
  process.exit(1);
}
const file = new URL('../lib/store-config.ts', import.meta.url);
const source = readFileSync(file, 'utf8');
const pattern = /export const storeMode: StoreMode = '(shop|box|get|rt)' as StoreMode;/;
if (!pattern.test(source)) throw new Error('Unexpected store config; no file changed.');
writeFileSync(file, source.replace(pattern, `export const storeMode: StoreMode = '${mode}' as StoreMode;`));
console.log(`Selected ${mode}. Restart the development server or build for deployment.`);
