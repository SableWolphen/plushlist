import { FRONT_OUTFITS, REAR_OUTFITS, frontOutfitTransform } from './mascot-wardrobe.js';
export function composeKeepsakeMascot(mascot, wardrobe, outfitId) {
  const body=mascot.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'');
  const defs=wardrobe.match(/<defs>([\s\S]*?)<\/defs>/)?.[1] || '';
  const known=FRONT_OUTFITS.has(outfitId)||REAR_OUTFITS.has(outfitId);
  const layer=position=>`<g transform="translate(3 0)"><g transform="${position==='front'?frontOutfitTransform(outfitId)||'translate(0 0)':'translate(0 0)'}"><use href="#${outfitId}-${position}" width="100" height="100"/></g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="330" viewBox="0 0 120 110"><defs>${defs}</defs><g transform="translate(5 5)">${known&&REAR_OUTFITS.has(outfitId)?layer('back'):''}${body}${known&&FRONT_OUTFITS.has(outfitId)?layer('front'):''}</g></svg>`;
}
export async function loadKeepsakeMascot(outfitId) {
  const responses=await Promise.all(['./assets/plushlife-mascot.svg','./assets/plush-outfits.svg'].map(path=>fetch(path)));
  if(responses.some(response=>!response.ok))throw new Error('Keepsake artwork unavailable');
  const [mascot,wardrobe]=await Promise.all(responses.map(response=>response.text()));
  const svg=composeKeepsakeMascot(mascot,wardrobe,outfitId);
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Keepsake artwork unavailable'));img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;});
}
