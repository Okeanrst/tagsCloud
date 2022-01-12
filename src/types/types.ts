export type ClassesT = {[key: string]: string};

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
    color: string;
  }>;

export type TwoDimensionalMapT = Array<Array<boolean>>;

export type TwoDimensionalMapMetaT = {
  firstNotEmptyRow: number;
  lastNotEmptyRow: number;
  firstNotEmptyColumn: number;
  lastNotEmptyColumn: number;
  glyphsXOffset: number;
  glyphsYOffset: number;
};

export type RectAreaT = {
  rows: number;
  cols: number;
};

export type IdRectAreaMapT = {
  key: string;
  map: TwoDimensionalMapT | null;
  mapMeta: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    glyphsXOffset: number;
    glyphsYOffset: number;
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
  glyphsXOffset?: number;
  glyphsYOffset?: number;
};

export type PositionedTagRectT = TagRectT &
  Required<RectPositionT> & { rotate: boolean };

export type PositionedTagSvgDataT = Readonly<
  PositionedTagRectT & {
    rectTranslateX: number;
    rectTranslateY: number;
  }
>;
