export type TagSentimentT = Readonly<{
  negative?: number;
  neutral?: number;
  positive?: number;
}>;

export type TagDataT = Readonly<{
  id: string;
  label: string;
  volume?: number;
  type?: string;
  sentiment?: TagSentimentT;
  sentimentScore: number;
  burst?: number;
  days?: ReadonlyArray<
    Readonly<{
      date: string;
      volume: number;
    }>
  >;
  pageType?: Readonly<{
    blog: number;
    facebook: number;
    forum: number;
    general: number;
    image: number;
    news: number;
    review: number;
    twitter: number;
    video: number;
  }>;
  queries?: any;
}>;

export type PreparedTagDataT = TagDataT &
  Readonly<{
    fontSize: number;
    fill: string;
  }>;

export type GlyphsMapT = Array<Array<boolean>>;

export type GlyphsMapMetaT = {
  firstNotEmptyRow: number;
  lastNotEmptyRow: number;
  firstNotEmptyColumn: number;
  lastNotEmptyColumn: number;
};

export type IdGlyphsMapT = {
  id: string;
  map: GlyphsMapT | null;
  meta: GlyphsMapMetaT | null;
};

export type RectAreaT = {
  rows: number;
  cols: number;
};

export type RectMapT = Array<Array<boolean>>;

export type IdRectAreaMapT = {
  id: string;
  map: RectMapT | null;
  mapMeta: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  } | null;
};

export type TagRectT = PreparedTagDataT & {
  square: number;
};

export type RectPositionT = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  rectTop?: number;
  rectBottom?: number;
  rectLeft?: number;
  rectRight?: number;
};

export type PositionedTagRectT = TagRectT &
  Required<RectPositionT> & { rotate: boolean };

export type PositionedTagSvgDataT = Readonly<
  PositionedTagRectT & {
    rectTranslateX: number;
    rectTranslateY: number;
    adaptFontSize: number;
  }
>;
