export type TagSentimentT = Readonly<{
  negative?: number;
  neutral?: number;
  positive?: number;
}>;

export type TagDataT = Readonly<{
  id: string;
  label: string;
  volume: number;
  type: string;
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
    width: number;
    height: number;
    fill: string;
  }>;

export type GlyphsMapT = Array<Array<boolean>>;

export type IdGlyphsMapT = {
  id: string;
  map: GlyphsMapT | null;
};

export type RectAreaT = {
  rows: number;
  cols: number;
};

export type RectMapT = Array<Array<boolean>>;

export type TagRectT = PreparedTagDataT & {
  rows: number;
  cols: number;
  square: number;
  rotate?: boolean;
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

export type PositionedTagRectT = TagRectT & Required<RectPositionT>;

export type PositionedTagSvgDataT = Readonly<
  PositionedTagRectT & {
    rectTranslateX: number;
    rectTranslateY: number;
    adaptFontSize: number;
  }
>;
