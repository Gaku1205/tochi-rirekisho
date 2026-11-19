// 福岡市の町ごとの記録。年代ごとの土地の様子・浸水・地盤・地価と、手で書いた昔の土地の様子の要約（災害リスクは言い切らない）。
// 浸水・地盤・地価は公開データ（src/data/flood.json・ground.json・price.json）から作る。
import type { Era } from "./layers";
import type { LatLon } from "./geo";
import { floodFeature, floodFor, type Flood } from "./flood";
import { groundFor, lowlandFeature, type Ground } from "./ground";
import { priceFor, type Price } from "./price";

export type Ward = "東区" | "博多区" | "中央区" | "南区" | "城南区" | "早良区" | "西区";

export type EraRow = { era: Era; title: string; text: string };

/** 似た土地を探すための特徴（どれも 0〜1。flood だけ、データが無い町は null） */
export type Features = {
  /** 1926年の地形図で田んぼだった割合 */
  paddy: number;
  /** 1926年の地形図で林・丘だった割合 */
  forest: number;
  /** 1926年にすでに家が建っていた割合 */
  town: number;
  /** 砂浜・砂丘・松原だった割合 */
  sand: number;
  /** 浸水の想定の深さ（3m で 1）。データなしは null で、比べるときは使わない */
  flood: number | null;
  /** 低い土地か（低地 1・台地 0.4・丘や砂丘 0） */
  lowland: number;
  /** 川までの近さ（すぐそば 1、2km 以上 0） */
  river: number;
  /** 住宅地になった遅さ（1926年以前 0、2000年代 1） */
  late: number;
};

export type Place = {
  slug: string;
  ward: Ward;
  /** 町名の前半（題名の上の札） */
  town: string;
  /** 町名の後半（題名の下の札）。無ければ空 */
  block: string;
  /** 読み（検索に使う） */
  kana: string;
  near: string;
  at: LatLon;
  summary: string;
  eras: EraRow[];
  flood: Flood;
  ground: Ground;
  price: Price;
  features: Features;
};

type RawPlace = Omit<Place, "flood" | "ground" | "price" | "features"> & { features: Omit<Features, "flood"> };

const RAW_PLACES: RawPlace[] = [
  {
    slug: "ohashi-2",
    ward: "南区",
    town: "大橋",
    block: "2丁目",
    kana: "おおはし",
    near: "西鉄大橋駅の南東 500m",
    at: { lat: 33.5557, lon: 130.4309 },
    summary:
      "大正のころ、ここは那珂川ぞいの田んぼでした。1970年代に埋めて住宅地になった、川の近くの低い土地です。",
    eras: [
      { era: "1926", title: "田んぼ", text: "那珂川の東にひろがる低い田。家は道ぞいに数軒だけ。" },
      { era: "1948", title: "田んぼと畑", text: "空中写真では、まだ田の区画がそのまま残っている。" },
      { era: "1975", title: "住宅地へ", text: "区画整理で田が埋められ、2階建ての家とアパートが並ぶ。" },
      { era: "2026", title: "駅前の住宅地", text: "西鉄大橋駅から歩いて6分。マンションと戸建てが混じる。" },
    ],
    features: { paddy: 0.85, forest: 0, town: 0.1, sand: 0, lowland: 1, river: 0.9, late: 0.55 },
  },
  {
    slug: "iseri-3",
    ward: "南区",
    town: "井尻",
    block: "3丁目",
    kana: "いじり",
    near: "西鉄井尻駅の東 300m",
    at: { lat: 33.5537, lon: 130.4395 },
    summary:
      "大正のころは那珂川と御笠川のあいだの田んぼで、線路ぞいに小さな集落がありました。1960〜70年代に家が建ち並んだ、平らな低地です。",
    eras: [
      { era: "1926", title: "田んぼと集落", text: "九州鉄道（いまの西鉄）の東に田が続き、井尻の集落が道ぞいにある。" },
      { era: "1948", title: "田んぼ", text: "田の区画がはっきり写る。駅の近くだけ家が固まる。" },
      { era: "1975", title: "住宅地へ", text: "田のほとんどが家に変わり、細い道が碁盤に通る。" },
      { era: "2026", title: "駅に近い住宅地", text: "戸建てと低いマンション。商店街が駅から東へのびる。" },
    ],
    features: { paddy: 0.75, forest: 0, town: 0.2, sand: 0, lowland: 1, river: 0.6, late: 0.45 },
  },
  {
    slug: "takeshita-3",
    ward: "博多区",
    town: "竹下",
    block: "3丁目",
    kana: "たけした",
    near: "JR竹下駅の北東 350m",
    at: { lat: 33.5755, lon: 130.4305 },
    summary:
      "大正のころから線路の脇に醸造所と学校があり、まわりは那珂川の東の田んぼでした。工場と家が混じって広がった、川に近い低地です。",
    eras: [
      { era: "1926", title: "醸造所と田", text: "線路の脇に醸造所と農学校。まわりは田と那珂川の川原。" },
      { era: "1948", title: "工場と田んぼ", text: "醸造所の大きな屋根が写る。南と西はまだ田。" },
      { era: "1975", title: "工場と住宅", text: "田が消え、工場・倉庫・家が入り混じる。" },
      { era: "2026", title: "駅前の住宅地", text: "工場の跡がマンションに。竹下駅まで歩いて5分。" },
    ],
    features: { paddy: 0.7, forest: 0, town: 0.15, sand: 0, lowland: 1, river: 0.85, late: 0.4 },
  },
  {
    slug: "itazuke-3",
    ward: "博多区",
    town: "板付",
    block: "3丁目",
    kana: "いたづけ",
    near: "板付遺跡の南 500m",
    at: { lat: 33.5655, lon: 130.4555 },
    summary:
      "大正のころは御笠川の西の広い田んぼでした。弥生時代の水田の跡が残る土地で、1980年代まで田が多く残っていた低地です。",
    eras: [
      { era: "1926", title: "田んぼ", text: "御笠川の西に田が続き、家は板付の集落だけ。" },
      { era: "1948", title: "田んぼ", text: "東に飛行場が写る。このあたりは田のまま。" },
      { era: "1975", title: "田んぼと住宅", text: "道ぞいから家が建ち始め、田と家がまだら。" },
      { era: "2026", title: "住宅地", text: "戸建ての住宅地。公園と遺跡の広場が近い。" },
    ],
    features: { paddy: 0.9, forest: 0, town: 0.05, sand: 0, lowland: 1, river: 0.55, late: 0.75 },
  },
  {
    slug: "tamura-3",
    ward: "早良区",
    town: "田村",
    block: "3丁目",
    kana: "たむら",
    near: "室見川の東 300m",
    at: { lat: 33.5478, lon: 130.3455 },
    summary:
      "大正のころは室見川ぞいの田んぼでした。1970〜80年代に区画整理で住宅地になった、川の近くの低い土地です。",
    eras: [
      { era: "1926", title: "田んぼ", text: "室見川の東に田がひろがり、田村の集落が丘の裾にある。" },
      { era: "1948", title: "田んぼ", text: "田の区画と用水路がそのまま写る。" },
      { era: "1975", title: "区画整理", text: "田が埋められ、まっすぐな道が引かれ始める。" },
      { era: "2026", title: "住宅地", text: "戸建てが並ぶ住宅地。川ぞいに遊歩道。" },
    ],
    features: { paddy: 0.8, forest: 0.05, town: 0.05, sand: 0, lowland: 1, river: 0.85, late: 0.65 },
  },
  {
    slug: "meinohama-ekiminami-1",
    ward: "西区",
    town: "姪浜駅南",
    block: "1丁目",
    kana: "めいのはまえきみなみ",
    near: "地下鉄姪浜駅の南 200m",
    at: { lat: 33.5805, lon: 130.3265 },
    summary:
      "大正のころは名柄川の河口に近い田んぼでした。1980年代に駅の南が区画整理され、住宅地になった海に近い低地です。",
    eras: [
      { era: "1926", title: "田んぼ", text: "姪浜の町の南に田が続き、名柄川が近くを流れる。" },
      { era: "1948", title: "田んぼ", text: "線路の南はほとんど田。" },
      { era: "1975", title: "田んぼと家", text: "道ぞいに家が増え、田がまだ半分残る。" },
      { era: "2026", title: "駅前の住宅地", text: "マンションが多い。地下鉄で天神まで15分。" },
    ],
    features: { paddy: 0.75, forest: 0, town: 0.1, sand: 0.1, lowland: 1, river: 0.6, late: 0.8 },
  },
  {
    slug: "befu-3",
    ward: "城南区",
    town: "別府",
    block: "3丁目",
    kana: "べふ",
    near: "地下鉄別府駅の南 400m",
    at: { lat: 33.5735, lon: 130.3705 },
    summary:
      "大正のころは樋井川ぞいの田んぼと、ゆるい丘の畑でした。戦後に家が建ち、いまは静かな住宅地です。",
    eras: [
      { era: "1926", title: "田んぼと畑", text: "樋井川の西に田、丘の上に畑と林。" },
      { era: "1948", title: "田んぼと家", text: "丘の裾に家が並び始める。" },
      { era: "1975", title: "住宅地", text: "田はほぼ消え、家とアパートが並ぶ。" },
      { era: "2026", title: "住宅地", text: "戸建てと低いマンション。大学が近い。" },
    ],
    features: { paddy: 0.5, forest: 0.15, town: 0.1, sand: 0, lowland: 0.7, river: 0.7, late: 0.35 },
  },
  {
    slug: "nishijin-4",
    ward: "早良区",
    town: "西新",
    block: "4丁目",
    kana: "にしじん",
    near: "地下鉄西新駅の北 300m",
    at: { lat: 33.5835, lon: 130.3595 },
    summary:
      "大正のころから家と学校が並ぶ町で、海ぞいの砂丘の上にあります。古くから住まれてきた土地です。",
    eras: [
      { era: "1926", title: "町と松原", text: "砂丘の上に家と学校。北は松原と砂浜。" },
      { era: "1948", title: "町", text: "家が詰まって並ぶ。海岸はまだ砂浜。" },
      { era: "1975", title: "町", text: "北の海が埋め立てられ始める。" },
      { era: "2026", title: "商店街と住宅", text: "商店街とマンション。大学のキャンパス跡が近い。" },
    ],
    features: { paddy: 0.05, forest: 0.1, town: 0.6, sand: 0.8, lowland: 0.2, river: 0.1, late: 0 },
  },
  {
    slug: "ropponmatsu-2",
    ward: "中央区",
    town: "六本松",
    block: "2丁目",
    kana: "ろっぽんまつ",
    near: "地下鉄六本松駅の東 250m",
    at: { lat: 33.5785, lon: 130.38 },
    summary:
      "大正のころは丘の上の畑と、学校の広い敷地でした。昔から住宅が多い、台地の上の土地です。",
    eras: [
      { era: "1926", title: "畑と学校", text: "台地の上に畑と学校の敷地。家は道ぞい。" },
      { era: "1948", title: "学校と家", text: "大きな校舎が写る。まわりに家が増える。" },
      { era: "1975", title: "住宅地", text: "畑が消え、家とアパートが並ぶ。" },
      { era: "2026", title: "駅前の街", text: "校舎の跡が新しい街に。地下鉄で天神まで8分。" },
    ],
    features: { paddy: 0.1, forest: 0.2, town: 0.4, sand: 0, lowland: 0.4, river: 0.2, late: 0.2 },
  },
  {
    slug: "nagaoka-3",
    ward: "南区",
    town: "長丘",
    block: "3丁目",
    kana: "ながおか",
    near: "西鉄大橋駅の西 1.6km",
    at: { lat: 33.5535, lon: 130.4075 },
    summary:
      "大正のころは林におおわれた丘でした。1960年代に丘を切り開いて住宅地にした土地です。",
    eras: [
      { era: "1926", title: "林の丘", text: "地形図では緑の林。家は丘の下だけ。" },
      { era: "1948", title: "林と畑", text: "丘の上に畑が切り開かれ始める。" },
      { era: "1975", title: "丘の住宅地", text: "丘が削られ、段になった住宅地に。" },
      { era: "2026", title: "坂の住宅地", text: "坂の多い静かな住宅地。見晴らしが良い。" },
    ],
    features: { paddy: 0.05, forest: 0.85, town: 0, sand: 0, lowland: 0, river: 0.1, late: 0.45 },
  },
  {
    slug: "hakozaki-1",
    ward: "東区",
    town: "箱崎",
    block: "1丁目",
    kana: "はこざき",
    near: "JR箱崎駅の西 400m",
    at: { lat: 33.6145, lon: 130.4225 },
    summary:
      "大正のころから宮の門前の町で、海ぞいの砂の高まりの上にあります。古くからの家並みが残る土地です。",
    eras: [
      { era: "1926", title: "門前の町", text: "宮の参道に家が並び、西は松原と海。" },
      { era: "1948", title: "町", text: "家並みは同じ。海ぞいに倉庫が増える。" },
      { era: "1975", title: "町と埋め立て", text: "西の海が埋め立てられ、港の土地になる。" },
      { era: "2026", title: "古い町並み", text: "参道と古い家並み。駅の東は大学の跡地。" },
    ],
    features: { paddy: 0.1, forest: 0, town: 0.6, sand: 0.6, lowland: 0.4, river: 0.3, late: 0 },
  },
  {
    slug: "maizuru-2",
    ward: "中央区",
    town: "舞鶴",
    block: "2丁目",
    kana: "まいづる",
    near: "地下鉄赤坂駅の北東 300m",
    at: { lat: 33.5918, lon: 130.3925 },
    summary:
      "大正のころから城下の町で、北は海に近い埋め立ての土地です。昔から市街地だった、平らな低い土地です。",
    eras: [
      { era: "1926", title: "城下の町", text: "地形図では赤い市街。北に海岸線が近い。" },
      { era: "1948", title: "焼け跡と町", text: "空襲のあとの空き地が点々と写る。" },
      { era: "1975", title: "ビルの町", text: "事務所のビルとマンションが建ち並ぶ。" },
      { era: "2026", title: "都心の街", text: "天神まで歩いて10分。ビルとマンション。" },
    ],
    features: { paddy: 0, forest: 0, town: 0.95, sand: 0.3, lowland: 0.8, river: 0.4, late: 0 },
  },
];

export const PLACES: Place[] = RAW_PLACES.map((p) => {
  const flood = floodFor(p.slug);
  const ground = groundFor(p.slug);
  const price = priceFor(p.slug);
  // 低い土地か：地盤が取れた町は分類から。null の町は手書きの値をそのまま使う
  const lowland = lowlandFeature(ground.value) ?? p.features.lowland;
  return { ...p, flood, ground, price, features: { ...p.features, lowland, flood: floodFeature(flood.depth) } };
});

export function placeBySlug(slug: string): Place | undefined {
  return PLACES.find((p) => p.slug === slug);
}

export const DEFAULT_PLACE: Place = PLACES[0];

export function fullName(p: Place): string {
  return `${p.town}${p.block}`;
}

export function address(p: Place): string {
  return `福岡市${p.ward}${p.town}${p.block}`;
}
