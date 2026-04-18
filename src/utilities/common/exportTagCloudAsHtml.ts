import { PositionedTagSvgDataT } from 'types/types';
import { FontFamilies } from 'constants/index';
import { SizeT, ViewBoxT } from 'types/types';

const escapeXmlText = (value: unknown) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const escapeXmlAttribute = (value: unknown) => escapeXmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const getTagCloudSvg = ({
  tagsSvgData,
  svgSize,
  viewBox,
  transform,
}: {
  tagsSvgData: ReadonlyArray<PositionedTagSvgDataT>;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  transform: string;
}) => {
  const textTags = tagsSvgData
    .map(({ color, fontSize, label, rectTranslateX, rectTranslateY, rotate }) => {
      const textTransform = `translate(${rectTranslateX}px,${rectTranslateY}px) rotate(${rotate ? 90 : 0}deg) scale(1)`;
      const textStyle = Object.entries({
        fill: color,
        'font-size': fontSize + 'px',
        transform: textTransform,
        'user-select': 'none',
      })
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      return `<text style="${escapeXmlAttribute(textStyle)}" text-anchor="middle">${escapeXmlText(label)}</text>`;
    })
    .join('');

  return (
    '<?xml version="1.0" ?>' +
    `<svg width="${escapeXmlAttribute(svgSize.width)}" height="${escapeXmlAttribute(
      svgSize.height,
    )}" viewBox="${escapeXmlAttribute(viewBox.join(' '))}" xmlns="http://www.w3.org/2000/svg">` +
    `<g transform="${escapeXmlAttribute(transform)}">` +
    textTags +
    '</g></svg>'
  );
};

const fontLinksByFontFamily = {
  [FontFamilies.OPEN_SANS]:
    '<link href="https://fonts.googleapis.com/css?family=Open+Sans&amp;subset=cyrillic&display=swap" rel="stylesheet" />',
  [FontFamilies.SPACE_MONO]:
    '<link href="https://fonts.googleapis.com/css2?family=Space+Mono&display=swap" rel="stylesheet">',
};

export const exportTagCloudAsHtml = ({
  tagsSvgData,
  svgSize,
  viewBox,
  transform,
  fontFamily,
}: {
  tagsSvgData: ReadonlyArray<PositionedTagSvgDataT>;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  transform: string;
  fontFamily: FontFamilies;
}) => {
  const objectClassName = 'svg';
  const head = `<title>Tag Cloud</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinksByFontFamily[fontFamily]}
<style>
.${objectClassName} {
  font-family: "${fontFamily}";
}
</style>`;
  const svg = getTagCloudSvg({ tagsSvgData, svgSize, viewBox, transform });
  const body = `<object type="image/svg+xml" data="tagCloud.svg" class="${objectClassName}">${svg}</object>`;
  return `<!DOCTYPE html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
};
