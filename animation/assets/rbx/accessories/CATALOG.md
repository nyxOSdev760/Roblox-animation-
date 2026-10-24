# Accessory library

Roblox catalog items imported with `tools/roblox_assets.py`, ready to put on R6 characters.
Each folder holds `model.json` (mesh already placed on the classic head) and `texture.png`.

Use in a scene:

```js
export const meta = { ..., accessories: ['hair-pal', 'face-crying-epic', 'face-addon-anger-mark-big'] };
createR6({ ..., accessories: ['hair-pal'], face: 'face-big-smile' });
character.setFace(['crying', 'face-addon-anger-mark-big']);  // layer pieces: decal + add-on
character.setFace(['face-eyes-shocked', 'face-mouth-small-frown']);  // build a face from parts
```

The face decals from `assets/faces/png/` (neutral, happy, grin, smirk, suspicious, sad, crying, angry, troll) work the same way by name.

## Hair (251, all user-made)

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `hair-360-waves-fade` | 360 Waves Fade | 5153072488 | genkroco |
| `hair-90s-inspired-blonde` | 90s Inspired Blonde Hair | 5644907218 | genkroco |
| `hair-adorable-doll-anime-side` | ☆ adorable y2k doll anime side light ginger | 130803216366675 | momo kiss |
| `hair-adorbs-black-long` | Adorbs black long hair | 6778986933 | Zayacti |
| `hair-afro-puff` | Cute Afro Puff | 6203040671 | Jazzyx3 |
| `hair-alt-wolf-cut-two` | Alt Wolf Cut Two-Tone Black & Blonde | 8358684655 | ReddieTheTeddy |
| `hair-anime-bob-cat-clip-2` | Anime Bob With Cat Clip(White) | 13653469162 | DIDIgamedev |
| `hair-anime-bob-cat-clip` | Anime Bob With Cat Clip(Black) | 13641279482 | DIDIgamedev |
| `hair-baseball-cap-cutie-2` | Baseball Cap Cutie | 4933287912 | Beeism |
| `hair-baseball-cap-cutie` | Baseball Cap Cutie | 4933287912 | Beeism |
| `hair-black-anime-slicked-back` | Black - Anime Slicked Back Hair (Short Version) | 133232372409812 | valako! |
| `hair-black-anime-wolf-cut` | Black Anime Wolf Cut Hair | 17274655265 | DIDIgamedev |
| `hair-black-anime` | Black Anime Hair | 5891039736 | PolarCub |
| `hair-black-balding-man` | Black Balding Man Hair | 14720386664 | 7ballcraze |
| `hair-black-celebrity-ponytails` | Celebrity Ponytails in Black | 6005339007 | Archi_tecture |
| `hair-black-curly-afro` | Black Curly Afro | 11748367474 | HYPSAL |
| `hair-black-curly-amazing-people` | Black Curly Hair For Amazing People  | 5703037305 | Muffinzs |
| `hair-black-cutesy-pigtails` | Black Cutesy Pigtails | 6239375692 | Zayacti |
| `hair-black-dawn` | Black Dawn Hairstyle | 7222634196 | DIDIgamedev |
| `hair-black-flowy-pigtails` | Black Flowy Pigtails | 6413288640 | simplyalemon |
| `hair-black-fluffy-anime-pigtails` | Black Fluffy Anime Hair with Pigtails | 11641826034 | Muemby |
| `hair-black-fluffy-middle-swept` | Black Fluffy Middle Swept Hair | 10323360626 | Rush_X |
| `hair-black-fluffy-short-bun` | Black Fluffy Short Bun Hair | 6361582090 | bunnexh |
| `hair-black-fluffy-swept` | Black Fluffy Middle Swept Hair | 10323360626 | Rush_X |
| `hair-black-grandpa-balding-old` | Black Grandpa Balding Old Man Hair | 7611023035 | DawsonDelRey |
| `hair-black-high-pigtails` | Long Black High Set Pigtails | 7069864579 | bunnexh |
| `hair-black-hime-short-straight` | Black Hime Short Straight Hair Cut | 13856173456 | AvaSky |
| `hair-black-layered-side-bangs` | Black Layered Hair with Side Bangs | 17191319260 | Alquo |
| `hair-black-long-swoop-cut` | Black Long Swoop Cut | 14647677135 | synodican |
| `hair-black-low-indie-pigtails` | Black Low Indie Pigtails | 8152737062 | Disordinance |
| `hair-black-messy-2` | Black Messy Hairstyle | 7259123616 | DIDIgamedev |
| `hair-black-messy-anime` | Black Messy Anime Hair | 6564177190 | sirehns |
| `hair-black-messy-bob` | Black Messy Bob | 7436830509 | Lirn |
| `hair-black-messy-buns` | Black Trendy Messy Buns | 5314006793 | Archi_tecture |
| `hair-black-messy-cat-boy` | Black Messy Cat Boy Hair | 7214151429 | Rush_X |
| `hair-black-messy-front-swoop` | Black Messy Front Swoop | 6880331820 | Rush_X |
| `hair-black-messy-manga` | Black Messy Manga Hair | 7183785281 | Rush_X |
| `hair-black-messy-side-part` | Black Messy Side Part | 6310032618 | Rush_X |
| `hair-black-messy-wavy-middle` | Black Messy Wavy Middle Part | 6594919952 | Rush_X |
| `hair-black-messy-wavy` | Black Messy Wavy Hair | 5461548581 | Homemade_Meal |
| `hair-black-messy` | Black Messy Hairstyle | 7259123616 | DIDIgamedev |
| `hair-black-middle-part-2` | Black Middle Part | 4932554634 | Homemade_Meal |
| `hair-black-middle-part` | Black Middle Part | 4932554634 | Homemade_Meal |
| `hair-black-mullet` | Black Mullet | 6128248269 | antilique |
| `hair-black-no-split-dye` | Black No Split-Dye Locs | 7904840542 | Lirn |
| `hair-black-old-hollywood-waves` | black old hollywood waves | 10476395186 | inkwaves |
| `hair-black-parted-short-fade` | Black - Parted Short Fade, Light Bangs | 96656411683020 | valako! |
| `hair-black-short-layered-bob` | Black Short Layered Bob | 16409592170 | AvaSky |
| `hair-black-short-messy-anime` | Black Short Messy Anime Hair | 7063885746 | sirehns |
| `hair-black-short-parted-2` | Black Short Parted Hair | 4875445470 | Homemade_Meal |
| `hair-black-short-parted` | Black Short Parted Hair | 4875445470 | Homemade_Meal |
| `hair-black-short-thin-bangs` | Black short hair w/ thin bangs | 6239088262 | Zayacti |
| `hair-black-short-wolf-cut` | Black Short Wolf Cut | 6441556987 | antilique |
| `hair-black-side-sweep` | Black Side Sweep Hair | 5920359974 | PolarCub |
| `hair-black-stylish-layered-bob` | Black Stylish Layered Bob | 15702973337 | DIDIgamedev |
| `hair-black-swept` | Black Swept Hair | 6413085241 | antilique |
| `hair-black-to-red-fluffy` | Black To Red Fluffy Middle Swept Hair | 10781701701 | Rush_X |
| `hair-black-trendy-messy-buns` | Black Trendy Messy Buns | 5314006793 | Archi_tecture |
| `hair-black-wolf-cut` | Black Short Wolf Cut | 6441556987 | antilique |
| `hair-blonde-adorable-braided` | Blonde Adorable Braided Hair | 6188729655 | Rush_X |
| `hair-blonde-bangs-bun` | Blonde Bangs w bun | 4584788319 | Erythia |
| `hair-blonde-braided-buns` | Blonde Braided Buns  | 5832853378 | PolarCub |
| `hair-blonde-braided-ponys` | Blonde Braided Ponys | 5860184632 | PolarCub |
| `hair-blonde-celebrity-ponytails` | Blonde Celebrity Ponytails | 6005325038 | Archi_tecture |
| `hair-blonde-curly-celebrity-2` | Blonde curly celebrity hair | 5918940548 | Archi_tecture |
| `hair-blonde-curly-celebrity` | Blonde curly celebrity hair | 5918940548 | Archi_tecture |
| `hair-blonde-curly-everyday` | Blonde curly everyday hair | 6323557311 | Archi_tecture |
| `hair-blonde-curly-high-ponytail` | Blonde Aesthetic Curly High Ponytail | 6005308235 | Archi_tecture |
| `hair-blonde-ethereal` | Blonde Ethereal Hairstyle | 5945433814 | genkroco |
| `hair-blonde-fashion-model-side` | Blonde Fashion Model Side-Part | 4847983495 | Sukimeki |
| `hair-blonde-flowy-pigtails` | Blonde Flowy Pigtails | 6413290259 | simplyalemon |
| `hair-blonde-french-braids` | Blonde French Braids | 4685691433 | Beeism |
| `hair-blonde-messy-2` | Blonde Messy Hairstyle | 7259308183 | DIDIgamedev |
| `hair-blonde-messy` | Blonde Messy Hairstyle | 7259308183 | DIDIgamedev |
| `hair-blonde-natural-trim-pony` | Blonde Natural Trim Pony | 5067664762 | Erythia |
| `hair-blonde-pigtails` | Blonde Flowy Pigtails | 6413290259 | simplyalemon |
| `hair-blonde-ponytail` | Aesthetic blonde ponytail | 7154630802 | Archi_tecture |
| `hair-blonde-popstar` | Blonde Popstar Hair | 5897464879 | genkroco |
| `hair-blonde-popular-shoulder-braids` | Blonde Popular Shoulder Braids | 7062036000 | Junozy |
| `hair-blonde-pride-double-buns` | Blonde Pride Double Buns | 5165287698 | MissRossiie |
| `hair-blonde-royal-braid` | Blonde Royal Braid | 4935030295 | Erythia |
| `hair-blonde-trendy-messy-buns` | Blonde Trendy Messy Buns | 5858859974 | Archi_tecture |
| `hair-blonde-wavy-ponytail` | Aesthetic blonde wavy ponytail | 5918943777 | Archi_tecture |
| `hair-blonde-wavy-short-pigtails` | Blonde Cute Wavy Hair with Short Pigtails | 9488055053 | Muemby |
| `hair-borealis-braids` | Borealis Braids | 5063916112 | Beeism |
| `hair-braided-pigtails-denim-cap` | 🍀Y2K Braided Pigtails w Denim Cap | 18825807191 | LILY & LIFFY |
| `hair-braided-stylish-low-ponies` | Braided Stylish Low Ponies in Caramel Ombre | 5506470976 | Beeism |
| `hair-braids-bangs-bandanna` | Braids, Bangs & a Bandanna | 5063973292 | Beeism |
| `hair-brown-anime-2` | Brown Anime Hair | 5891050261 | PolarCub |
| `hair-brown-anime` | Brown Anime Hair | 5891050261 | PolarCub |
| `hair-brown-blunt-bangs` | Brown Blunt Bangs | 5355333720 | Reverse_Polarity |
| `hair-brown-braided-buns` | Brown Braided Buns | 5832723245 | PolarCub |
| `hair-brown-braided-ponys` | Brown Braided Ponys | 5860180256 | PolarCub |
| `hair-brown-fashion-model-side` | Brown Fashion Model Side-Part | 4847992547 | Sukimeki |
| `hair-brown-flowy-2` | Brown Flowy Hair | 6689844655 | bunnexh |
| `hair-brown-flowy` | Brown Flowy Hair | 6689844655 | bunnexh |
| `hair-brown-messy` | Brown Messy Hairstyle | 7259172148 | DIDIgamedev |
| `hair-brown-mullet` | Brown Mullet | 6187500468 | antilique |
| `hair-brown-pride-double-buns` | Brown Pride Double Buns | 5165292009 | MissRossiie |
| `hair-brown-short-wolf-cut` | Brown Short Wolf Cut | 6441537838 | antilique |
| `hair-brown-side-sweep` | Brown Side Sweep Hair | 5920341268 | PolarCub |
| `hair-brown-wavy-ponytail` | Aesthetic brown wavy ponytail | 6005348300 | Archi_tecture |
| `hair-brunette-blonde-messy-ponytail` | Brunette & Blonde Messy Ponytail | 5802233192 | NUTEST |
| `hair-brunette-trendy-messy-buns` | Brunette Trendy Messy Buns | 5858867347 | Archi_tecture |
| `hair-business-comb-over` | Business Man Comb Over | 12299883619 | cyutsee |
| `hair-california-blonde` | California Girl Blonde Hair | 6522211748 | bunnexh |
| `hair-california-girl-blonde` | California Girl Blonde Hair | 6522211748 | bunnexh |
| `hair-california-girl-brown` | California Girl Brown Hair | 6522220525 | bunnexh |
| `hair-celebrity-ponytails-black` | Celebrity Ponytails in Black | 6005339007 | Archi_tecture |
| `hair-cool-boy-mullet-2` | Cool Boy Mullet | 6008020755 | genkroco |
| `hair-cool-boy-mullet` | Cool Boy Mullet | 6008020755 | genkroco |
| `hair-curly-afro-black` | Curly Afro  [Black] | 15442653160 | Wigzz |
| `hair-curly-iconic-iconic-people-2` | Curly iconic hair for iconic people in brown | 6066584853 | Archi_tecture |
| `hair-curly-iconic-iconic-people` | Curly iconic hair for iconic people in blonde | 6066575453 | Archi_tecture |
| `hair-dark-ethereal` | Dark Ethereal Hairstyle | 5945438043 | genkroco |
| `hair-dejah-loc` | Dejah Loc's | 11977296871 | Glam Factory |
| `hair-dream-girl-low-pigtails-2` | Dream Girl Low Pigtails Black n Rainbow | 5165675549 | OceanOrbs |
| `hair-dream-girl-low-pigtails` | Dream Girl Low Pigtails Blonde To Rainbow | 5234379995 | OceanOrbs |
| `hair-elegant-braided-bun` | Elegant Braided Bun | 6741327809 | Beeism |
| `hair-emo-half-up-side` | Emo half up side ponytail in Black | 78519397423927 | Archi_tecture |
| `hair-faded-edgar-cut` | Faded Edgar Cut | 12432342407 | bankwear |
| `hair-fairy-princess-preppy-low` | Fairy Princess Preppy Low Braids (Blonde & Pink) | 17520094851 | vOutfits |
| `hair-flower-messy-bun-black` | (꽃) Flower Messy Bun -  Black | 12953387530 | Muemby |
| `hair-fluffy-bob-panda-clip` | Fluffy Bob Panda Hair Clip Pigtail (Black & Pink) | 17487623009 | vOutfits |
| `hair-fluffy-layered-shaggy-black` | Fluffy Layered Shaggy (Black) | 9571729576 | dramfii |
| `hair-fluffy-layered-shaggy-blonde` | Fluffy Layered Shaggy (Blonde to Pink) | 9522967024 | dramfii |
| `hair-fluffy-messy-black` | Fluffy Messy Hair(Black) | 14892162637 | DIDIgamedev |
| `hair-fluffy-pixie-haircut-black` | Fluffy Pixie Haircut (Black) | 11387061216 | auroriies |
| `hair-fluffy-pixie-haircut-white` | Fluffy Pixie Haircut (White) | 11387072569 | auroriies |
| `hair-fluffy-ponytail-blonde` | Aesthetic Fluffy Ponytail In Blonde | 7032734415 | Lukacors |
| `hair-fluffy-ponytail-brown` | Aesthetic Fluffy Ponytail In Brown | 7065741117 | Lukacors |
| `hair-fluffy-wolf-cut-black` | Fluffy Wolf Cut(Black) | 15089852977 | DIDIgamedev |
| `hair-glamorous-ponytail-black` | Glamorous Ponytail in Black | 6343739230 | MissRossiie |
| `hair-gospel-girl-black` | Gospel Girl Hair in Black | 9731173784 | BUNNEXH |
| `hair-grandpa-gray` | Gray Grandpa Balding Old Man Hair | 7611015444 | DawsonDelRey |
| `hair-grandpa-white` | White Grandpa Balding Old Man Hair | 7611004838 | DawsonDelRey |
| `hair-grunge-wolf-black` | Grunge wolf hair Black | 11770892209 | Archi_tecture |
| `hair-gyaru-leopard-print-butterfly` | gyaru leopard print butterfly cut (honey blonde) | 118409335769258 | parfei |
| `hair-half-up-blonde` | Aesthetic half up hair in blonde | 6256894291 | Archi_tecture |
| `hair-half-up-half-down` | Cute Half up Half Down Pigtails(Brown) | 13895364348 | DIDIgamedev |
| `hair-high-top-fade` | High Top Fade | 5164439083 | genkroco |
| `hair-jay-jo-mullet` | Jay Jo Mullet | 72363502718122 | GODSBLOOD |
| `hair-kawaii-blonde-curly-dolli` | ノ꒰ kawaii blonde curly dolli hair ❤︎ ͡ 𐦯 | 106037782241577 | bunmiu |
| `hair-large-curly-messy-buns` | Large curly messy buns in blonde | 6875093956 | Archi_tecture |
| `hair-layered-fringe` | Layered Fringe   | 6065691176 | genkroco |
| `hair-lazy-bun` | Lazy Bun | 5197263386 | Beeism |
| `hair-lazy-low-buns` | Lazy Low Buns | 6682204447 | Beeism |
| `hair-light-brown-ethereal-2` | Light Brown Ethereal Hairstyle  | 5945436918 | genkroco |
| `hair-light-brown-ethereal` | Light Brown Ethereal Hairstyle  | 5945436918 | genkroco |
| `hair-light-brown-layered-fringe` | Light Brown Layered Fringe | 6065692853 | genkroco |
| `hair-long-black-2` | Long Black Hair | 6536255505 | antilique |
| `hair-long-black-high-set` | Long Black High Set Pigtails | 7069864579 | bunnexh |
| `hair-long-black-ponytail-thin` | Long black ponytail w/ thin bangs  | 6343602761 | Zayacti |
| `hair-long-black` | Long Black Hair | 6536255505 | antilique |
| `hair-long-blonde-2` | Long Blonde Hair | 6536289312 | antilique |
| `hair-long-blonde-brown-high` | Long Blonde & Brown High Set Pigtails | 7098840743 | bunnexh |
| `hair-long-blonde-high-set` | Long Blonde High Set Pigtails | 7069883034 | bunnexh |
| `hair-long-blonde` | Long Blonde Hair | 6536289312 | antilique |
| `hair-long-brunette-2` | Long Brunette Hair | 6536243519 | antilique |
| `hair-long-brunette` | Long Brunette Hair | 6536243519 | antilique |
| `hair-long-messy-ponytail-black` | Aesthetic Long Y2k Messy Ponytail (Black) | 10084548738 | dramfii |
| `hair-long-messy-ponytail-blonde` | Aesthetic Long Y2k Messy Ponytail (Blonde) | 10084537101 | dramfii |
| `hair-long-straight-fanned-hime` | Long Straight Fanned Hime Cut Hair (Blonde) | 15106303028 | luckyyloll |
| `hair-long-swirly-curly-vamp-2` | long swirly curly vamp haircut bangs white | 18692750382 | umeko' |
| `hair-long-swirly-curly-vamp` | long swirly curly vamp haircut bangs black | 18692678173 | umeko' |
| `hair-loose-black-anime-side` | Loose Black Anime Side Buns | 6211939438 | bunnexh |
| `hair-loose-ginger-wavy-bangs` | Loose Ginger Wavy Bangs | 9581742300 | bunnexh |
| `hair-loose-long-bangs-anime-2` | Loose Long Bangs Anime Pigtails in Black | 8207687270 | StrapCode |
| `hair-loose-long-bangs-anime` | Loose Long Bangs Anime Pigtails in Blonde | 8207677764 | StrapCode |
| `hair-loose-pink-anime-side` | Loose Pink Anime Side Buns | 6221438488 | bunnexh |
| `hair-loose-wavy-brown` | Loose Wavy Hairstyle(Brown) | 13823150138 | DIDIgamedev |
| `hair-lovely-silver-locks` | Lovely Silver Locks | 5099895657 | PolarCub |
| `hair-low-clipped-short-ponytail` | Y2K Low Clipped Short Ponytail - Blonde | 9239256157 | Archi_tecture |
| `hair-low-fade-taper-mullet` | low fade taper mullet 2.0 | 17416513560 | 1000thorns |
| `hair-low-piggytails-blonde` | Aesthetic low piggytails in blonde | 6849134538 | Archi_tecture |
| `hair-lush-wavy-bangs-black` | Lush Wavy Hair w/ Bangs(Black) | 15308647622 | DIDIgamedev |
| `hair-material-girl-blonde` | Material Girl Blonde Hair | 8128966808 | bunnexh |
| `hair-material-girl-ginger` | Material Girl Ginger Hair | 8129130224 | bunnexh |
| `hair-mermaid-waves-brown` | Messy Mermaid Waves(Brown) | 13421692825 | DIDIgamedev |
| `hair-messy-black-pulled-back` | Messy Black Pulled Back Hair Bun | 86881252364152 | Alquo |
| `hair-messy-black` | Messy Black Hair | 5064651922 | Kiouhei |
| `hair-messy-boy-black-2` | Messy Boy Hair in Black | 6823338112 | Rush_X |
| `hair-messy-boy-black` | Messy Boy Hair in Black | 6823338112 | Rush_X |
| `hair-messy-boy-blonde` | Messy Boy Hair in Blonde | 6823411442 | Rush_X |
| `hair-messy-buns-black` | Y2K Messy Buns in Black | 9365089652 | auroriies |
| `hair-messy-half-up-grunge` | messy half-up grunge ponytail (dark teal) | 135815711412628 | parfei |
| `hair-messy-mermaid-waves-black` | Messy Mermaid Waves(Black) | 13421587456 | DIDIgamedev |
| `hair-messy-mermaid-waves-brown` | Messy Mermaid Waves(Brown) | 13421692825 | DIDIgamedev |
| `hair-messy-ponytail-black` | Aesthetic Y2k Messy Ponytail (Black) | 9067113301 | dramfii |
| `hair-messy-ponytail-brown` | Aesthetic Y2k Messy Ponytail (Brown) | 9058123955 | dramfii |
| `hair-messy-popular-boy-black` | Messy Popular Boy Hair in Black | 6594911228 | Rush_X |
| `hair-messy-popular-boy` | Messy Popular Boy Hair in Black | 6594911228 | Rush_X |
| `hair-messy-pulled-back-blonde` | Messy Pulled back Blonde Hair Bun | 94611248083546 | Alquo |
| `hair-mini-pigtails-chopped-bangs` | Cute Mini Pigtails & Chopped Bangs Black | 5764649581 | Erythia |
| `hair-mini-pigtails-ribbons-beige` | Mini Pigtails with Ribbons(Beige) | 14797410243 | DIDIgamedev |
| `hair-pigtail-locs-black` | Pigtail Locs Black | 8055965752 | Lirn |
| `hair-pixie-cut` | Pixie Cut | 7323152045 | genkroco |
| `hair-platinum-space-bun-braid` | Platinum Space Bun Braid | 4602272831 | Erythia |
| `hair-popstar-black` | Popstar Hair | 5890690147 | genkroco |
| `hair-popstar` | Popstar Hair | 5890690147 | genkroco |
| `hair-popular-girl-blonde-brown-2` | Popular Girl Blonde & Brown Hair | 6501746646 | bunnexh |
| `hair-popular-girl-blonde-brown` | Popular Girl Blonde & Brown Hair | 6501746646 | bunnexh |
| `hair-popular-girl-blonde` | Popular Girl Blonde Hair | 6472141506 | bunnexh |
| `hair-preppy-braided-blonde` | Preppy Braided Hair (Blonde) | 11289622561 | auroriies |
| `hair-preppy-braided-loose-buns` | Preppy braided loose buns in blonde | 9605313021 | Archi_tecture |
| `hair-preppy-braided-messy-pigtails` | Preppy braided messy pigtails - Blonde | 11909174463 | Archi_tecture |
| `hair-punk-mini-pigtails-white` | Punk Mini Pigtails(White) | 15350532578 | DIDIgamedev |
| `hair-red-streaked-messy-pulled` | Red Streaked Messy Pulled back Bun  | 108202075299356 | Alquo |
| `hair-shimmering-brown-braided-ponies` | Shimmering Brown Braided Ponies | 4735215345 | Beeism |
| `hair-shimmering-brown-french-braids` | Shimmering Brown French Braids | 4684968628 | Beeism |
| `hair-shimmering-side-part-black` | Shimmering Side-Part in Black | 6473073307 | MissRossiie |
| `hair-short-layered-v2` | Short Layered Hair v2 | 7667986156 | genkroco |
| `hair-short-pink-fluffy` | Short Pink Fluffy Hair | 4997328475 | Sukimeki |
| `hair-short-wavy-black` | Short Wavy Black Hair | 5551033198 | genkroco |
| `hair-short-wolf-cut-black` | Short Wolf Cut(Black) | 16199722680 | DIDIgamedev |
| `hair-short-wolf-cut-ginger` | Short Wolf Cut(Ginger) | 16199920539 | DIDIgamedev |
| `hair-short-wolf-cut-red` | Short Wolf Cut(Red Ombre) | 16200154273 | DIDIgamedev |
| `hair-side-parted-slicked-back` | Side Parted Slicked Back Gojo Hair | 120478611992895 | blanksfall |
| `hair-silky-afro-pigtails` | Silky Afro Pigtails | 8705233070 | MURCE |
| `hair-silver-locks` | Lovely Silver Locks | 5099895657 | PolarCub |
| `hair-sk8r-girl-blonde` | Sk8r Girl Blonde Hair | 5063538761 | Reverse_Polarity |
| `hair-soft-long-black-bangs` | Soft Long Black Bangs | 6312074205 | bunnexh |
| `hair-soho-brown-curly` | Soho Brown Curly Hair | 5300294701 | ComfySunday |
| `hair-soho-straight` | Soho Straight Hair | 6069550287 | ComfySunday |
| `hair-spikey-bun-black` | 🍀Y2K Spikey Bun (Black) | 17630469512 | LILY & LIFFY |
| `hair-spikey-bun-denim-cap-2` | 🍀Y2K Spikey Bun w Denim Cap | 18826491711 | LILY & LIFFY |
| `hair-spikey-bun-denim-cap` | 🍀Y2K Spikey Bun w Denim Cap | 18826491711 | LILY & LIFFY |
| `hair-split-bangs-black` | Aesthetic Split Bangs Hair in Black  | 7284112915 | Lukacors |
| `hair-split-bangs-blonde` | Aesthetic Split Bangs Hair in Blonde | 7284206648 | Lukacors |
| `hair-split-bangs-brown` | Aesthetic Split Bangs Hair in Brown  | 7284085462 | Lukacors |
| `hair-straight-long-hime-cut` | Straight Long Hime Cut Hair (Blonde) | 12913266387 | gyansu |
| `hair-super-messy-fluffy-boy` | Super Messy Fluffy Boy Hair Black | 12887129839 | bankwear |
| `hair-swept-burst-fade-black` | Swept Burst Fade Hair Black Highlights | 96034509334513 | Hairworks |
| `hair-twice-pink-ombre-braids` | TWICE Pink Ombre Braids | 13527577327 | JYP Official |
| `hair-vintage-wavy-blonde-bob` | Vintage Wavy Blonde Bob | 6036130430 | antilique |
| `hair-vintage-wavy-blonde-to` | Vintage Wavy Blonde to Pink Bob | 6036980028 | antilique |
| `hair-vintage-wavy-brown-bob` | Vintage Wavy Brown Bob | 6036361223 | antilique |
| `hair-voluminous-kawaii-long-side` | Voluminous Kawaii Long Hair with a Side Pigtail | 17609711240 | vOutfits |
| `hair-wavy-half-up-pigtails-2` | Wavy Half up Pigtails with Ribbons(Brown) | 14157129268 | DIDIgamedev |
| `hair-wavy-half-up-pigtails` | Wavy Half up Pigtails with Ribbons(PlatinumBlonde) | 14157167962 | DIDIgamedev |
| `hair-wavy-low-piggytails-blonde` | Aesthetic wavy low piggytails in blonde | 7000721166 | Archi_tecture |
| `hair-wavy-low-ponytail-ginger` | Wavy Low Ponytail(Ginger) | 14582410171 | DIDIgamedev |
| `hair-wavy-white-voluminous` | Wavy White Voluminous Hair | 6239388754 | PolarCub |
| `hair-white-anime-2` | White Anime Hair | 5891091101 | PolarCub |
| `hair-white-anime` | White Anime Hair | 5891091101 | PolarCub |
| `hair-white-fluffy-middle-swept` | White Fluffy Middle Swept Hair | 10323431381 | Rush_X |
| `hair-white-grandpa-balding-old` | White Grandpa Balding Old Man Hair | 7611004838 | DawsonDelRey |
| `hair-white-messy-bun-pulled` | White Messy Hair Bun Pulled Back | 94251922236394 | Alquo |
| `hair-white-messy` | White Messy Hairstyle | 7259147441 | DIDIgamedev |
| `hair-wolf-cut-messy-mullet-2` | Wolf Cut Messy Mullet Hair in White | 15728302236 | munuko |
| `hair-wolf-cut-messy-mullet` | Wolf Cut Messy Mullet Hair in Black | 15728271241 | munuko |

## UGC faces (37)

### Full faces

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `face-about-to-cry` | 😭 ANIMATED!! About To Cry Face (3D) 😭 | 12685922805 | Headpets |
| `face-big-grin-retro` | 😁 Retro Big Grin Face (3D) 😁 | 11436970727 | Headpets |
| `face-big-smile` | 😄 Big Smile Face (3D) 😄 | 12409796490 | Headpets |
| `face-big-smile-blush` | 😄 Blushing Big Smile Face (3D) 😄 | 12064732367 | Headpets |
| `face-crying-epic` | 😭 Epic Crying Face (3D) 😭 | 10861413715 | Headpets |
| `face-derp-block` | Derp Face | 11621961717 | i_Sininho |
| `face-derp-silly` | 😋 Silly Derp Face (3D) 😋 | 10861393478 | Headpets |
| `face-dizzy-epic` | 😵 Epic Dizzy Face (3D) 😵 | 10924889010 | Headpets |
| `face-glitched-eyes` | Cute Face w/ Glitched Cursed Eyes [Animated] | 114875031523165 | Szeloba |
| `face-kawaii-silly-blush` | Kawaii Silly Blush Face | 14448885488 | VireDero |
| `face-rockstar` | 🤩 Glam Rockstar Face (3D) 🤩 | 12377415294 | Headpets |
| `face-scary-grin` | 💀 Scary Grin Face (3D) 💀 | 11110585672 | Headpets |
| `face-shocked-ring-eyes` | Manga Mask - Shock | 7031996304 | nezko |
| `face-skeptical-eyes` | Skeptical Eyes (3D) | 14768716017 | lucaduke |
| `face-sleepy` | Cute Sleepy Eyebag Face | 11463392143 | Blizzei |
| `face-squint-tongue` | 😛 Cute Squinting BIG Tongue Face (3D) 😛 | 12336875201 | Headpets |
| `face-terrified` | Terrified Emotion Mask | 10927351089 | Reverse_Polarity |
| `face-wink-happy` | 😉 Happy Wink Face (3D) 😉 | 11187091719 | Headpets |
| `face-worried-teary` | Cute Face | 13628182787 | thienchamuc |
| `face-worry-manga` | Manga Mask - Worry | 7033871971 | nezko |

### Emoji masks

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `face-emoji-crying` | Crying Mask 😭 | 6380521445 | glowlez |
| `face-emoji-sweating` | Sweating and Crying Mask 😰 | 6403813025 | glowlez |
| `face-emoji-upside-down-frown` | Upside Down Frown Emoji Mask | 6690155267 | penguim2 |

### Eyes only

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `face-eyes-gyaru-lashes` | Cute Gyaru Eyelashes | 10713991705 | vuitie |
| `face-eyes-shocked` | Cartoon Shocked Eyes | 13155406762 | Protopoly |
| `face-eyes-skeptical-lower` | Lower Skeptical Eyes (3D)  | 14768717128 | lucaduke |
| `face-eyes-sleepy` | Cute Sleepy Face | 11720215989 | Blizzei |

### Mouths only

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `face-mouth-monstrous-grin` | Monstrous Grin | 11396175709 | Reverse_Polarity |
| `face-mouth-shark-grin` | Shark Grin Sticker | 11197184218 | BoiledCrickets |
| `face-mouth-slight-frown` | Slight Frown Mouth | 11491185356 | Blizzei |
| `face-mouth-small-frown` | Small Frown | 11568711453 | Blizzei |
| `face-mouth-smirk` | 😏 Smirk Mouth (3D) 😏 | 13445668357 | Headpets |

### Add-ons (layer on top of any face)

| Slug | Catalog name | Asset ID | Creator |
|---|---|---|---|
| `face-addon-anger-mark-big` | 🔴 Red Angry Anime Hitmarker Filter 🔴 | 9922633567 | RobotGentleman |
| `face-addon-blush` | Blush Sticker Filter | 10716153814 | Blizzei |
| `face-addon-cry-streams` | Cry baby | 4154590589 | WhoToTrus |
| `face-addon-sweat-drop` | 💧 Anime Sweat Droplet Filter 💧 | 11026319085 | RobotGentleman |
| `face-addon-tears` | Crying | 4465463368 | Builder_Boy |

