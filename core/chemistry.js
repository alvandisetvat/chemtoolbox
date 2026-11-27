/* فرهنگ مشترک مواد: رنگ‌ها فقط در همین فایل تعریف می‌شوند تا همهٔ شبیه‌سازی‌ها یک‌دست باشند.
   ویرایش یا افزودن ماده فقط با هماهنگی «یکپارچه‌ساز» استان انجام شود. */

/* powder  : رنگ پودر/بلور جامد
   sol     : رنگ محلول در آب
   solA    : غلظت رنگ محلول (۰ = بی‌رنگ، ۱ = پررنگ)
   kind    : 'pellet' برای مواد قرصی (مثل NaOH) */
export const SPECIES={
  FeCl2:{formula:'FeCl₂',name:'آهن (II) کلرید',powder:0xb7d4a6,sol:0xb9dca8,solA:.5},
  FeCl3:{formula:'FeCl₃',name:'آهن (III) کلرید',powder:0xb5651d,sol:0xe6a417,solA:.95},
  FeSO4:{formula:'FeSO₄',name:'آهن (II) سولفات',powder:0xc9dcc0,sol:0xcfe6c4,solA:.35},
  Fe2O3:{formula:'Fe₂O₃',name:'زنگ آهن',powder:0x9a4c1a,sol:0xe6a417,solA:.9},
  NaOH:{formula:'NaOH',name:'سدیم هیدروکسید',powder:0xf2f2ee,sol:0xeaf4ff,solA:.02,kind:'pellet'},
  NaCl:{formula:'NaCl',name:'سدیم کلرید',powder:0xf4f4f2,sol:0xeaf4ff,solA:.02},
  AgNO3:{formula:'AgNO₃',name:'نقره نیترات',powder:0xf1f1ee,sol:0xeaf4ff,solA:.02},
  Na3PO4:{formula:'Na₃PO₄',name:'سدیم فسفات',powder:0xf2f2ef,sol:0xeaf4ff,solA:.02},
  Na2SO4:{formula:'Na₂SO₄',name:'سدیم سولفات',powder:0xf3f3f0,sol:0xeaf4ff,solA:.02},
  BaCl2:{formula:'BaCl₂',name:'باریم کلرید',powder:0xf3f3f0,sol:0xeaf4ff,solA:.02},
  CaCl2:{formula:'CaCl₂',name:'کلسیم کلرید',powder:0xf0f0ec,sol:0xeaf4ff,solA:.02},
  MgCl2:{formula:'MgCl₂',name:'منیزیم کلرید',powder:0xf0f0ec,sol:0xeaf4ff,solA:.02},
  CaO:{formula:'CaO',name:'کلسیم اکسید',powder:0xf1eee4,sol:0xeaf4ff,solA:.02},
  CuSO4:{formula:'CuSO₄',name:'مس (II) سولفات',powder:0x2c6fd1,sol:0x3b9ae1,solA:.9},
  soap:{formula:'RCOONa',name:'صابون رنده‌شده',powder:0xf1e4c3,sol:0xf4f8fb,solA:.05},
  HCl:{formula:'HCl',name:'هیدروکلریک اسید',powder:0xf0f0f0,sol:0xeaf6ff,solA:0}
};

/* رنگ رسوب‌ها و رسوب‌نشانه‌ها */
export const PRECIPITATE={
  'Fe(OH)2':0x4f8f6b,      // سبز
  'Fe(OH)3':0xa94a1b,      // قرمز‌قهوه‌ای
  'AgCl':0xf6f6f2,         // سفید
  'BaSO4':0xf7f7f5,        // سفید
  'Ca3(PO4)2':0xf3f3ef,    // سفید
  'Ca(OH)2':0xf4f4ef,      // سفید (شیری)
  'Cu(OH)2':0x5aa0e8,      // آبی روشن
  'Cu':0xb87333,           // فلز مس
  'soap-scum':0xf0ece0     // رسوب صابون
};

export function species(id){
  const s=SPECIES[id];
  if(!s)throw new Error(`ماده‌ای با شناسهٔ «${id}» در core/chemistry.js تعریف نشده است. شناسه‌های موجود: ${Object.keys(SPECIES).join(', ')}`);
  return s;
}
export function precipitate(id){
  const c=PRECIPITATE[id];
  if(c===undefined)throw new Error(`رسوب «${id}» در core/chemistry.js تعریف نشده است. موجود: ${Object.keys(PRECIPITATE).join(', ')}`);
  return c;
}
