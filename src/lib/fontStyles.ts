import { FontStyle } from '../types'

export interface FontStyleOption {
  value: FontStyle;
  label: string;
  badge: string;
  description: string;
  previewText: string;
  cssFamily: string;
  assetPath: string;
}

export const FONT_STYLE_OPTIONS: FontStyleOption[] = [
  {
    value: 'rubik',
    label: 'Rubik',
    badge: 'מודרני',
    description: 'נקי, מאוזן, ומתאים למילוי יומיומי.',
    previewText: 'אבגדהוז חטיכלמ 123',
    cssFamily: "'Rubik Local', 'Rubik', sans-serif",
    assetPath: 'Rubik-Regular.ttf',
  },
  {
    value: 'alef',
    label: 'Alef',
    badge: 'נקי',
    description: 'קלאסי וקריא, עם אופי מעט רך יותר.',
    previewText: 'אבגדהוז חטיכלמ 123',
    cssFamily: "'Alef', 'Rubik Local', sans-serif",
    assetPath: 'fonts/Alef-Regular.ttf',
  },
  {
    value: 'david-libre',
    label: 'David Libre',
    badge: 'רשמי',
    description: 'מראה יותר טקסי ומסורתי.',
    previewText: 'אבגדהוז חטיכלמ 123',
    cssFamily: "'David Libre', 'Rubik Local', serif",
    assetPath: 'fonts/DavidLibre-Regular.ttf',
  },
  {
    value: 'amatic-sc',
    label: 'Amatic SC',
    badge: 'כתב יד',
    description: 'גבוה, חופשי, וקצת שובב.',
    previewText: 'אבגדהוז חטיכלמ 123',
    cssFamily: "'Amatic SC', 'Rubik Local', cursive",
    assetPath: 'fonts/AmaticSC-Regular.ttf',
  },
  {
    value: 'solitreo',
    label: 'Solitreo',
    badge: 'כתב יד',
    description: 'כתב יד זורם וחם עם אופי אישי.',
    previewText: 'אבגדהוז חטיכלמ 123',
    cssFamily: "'Solitreo', 'Rubik Local', cursive",
    assetPath: 'fonts/Solitreo-Regular.ttf',
  },
]

const FONT_STYLE_BY_VALUE = FONT_STYLE_OPTIONS.reduce<Record<FontStyle, FontStyleOption>>(
  (acc, option) => {
    acc[option.value] = option
    return acc
  },
  {} as Record<FontStyle, FontStyleOption>
)

export function getFontStyleOption(fontStyle: FontStyle | undefined): FontStyleOption {
  return FONT_STYLE_BY_VALUE[fontStyle ?? 'rubik'] ?? FONT_STYLE_BY_VALUE.rubik
}
