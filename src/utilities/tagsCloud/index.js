export function prepareData(data, options = {}) {
  const {minFontSize = 6, maxFontSize = 36, horizontalMargin = 20, verticalMargin = 20} = options;

  const countRating = ({positive = 0, neutral = 0, negative = 0} = {}) => positive - negative;

  let minRating = 0;
  let maxRating = 0;
  data.forEach(item => {
    item.rating = countRating(item.sentiment);
    if (minRating > item.rating) {
      minRating = item.rating;
    }
    if (maxRating < item.rating) {
      maxRating = item.rating;
    }
  });

  const ratio = (maxFontSize - minFontSize) / (maxRating - minRating);
  data.forEach(item => item.fontSize = minFontSize + Math.round((item.rating - minRating) * ratio));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const horizMargin = 1 + horizontalMargin / 100;
  const vertMargin = 1 + verticalMargin / 100;

  //TODO use opentype.js
  const fontSizeFactor = 1.12;

  data.forEach(item => {
    ctx.font = `${item.fontSize}px OpenSans`;
    const measure = ctx.measureText(item.label);
    item.width = measure.width * horizMargin;

    item.height = item.fontSize * fontSizeFactor * vertMargin;
    item.fill = randomColor();
  });

  return data;
}

export function adaptDataToScene(data, sceneWidth, {horizontalMargin = 20, verticalMargin = 20} = {}) {
  let maxTop;
  let minBottom;
  let maxRight;
  let minLeft;
  data.forEach(item => {
    const rectTop = item.rectBottom + item.height;
    if (rectTop > maxTop || maxTop === undefined) {
      maxTop = rectTop;
    }

    if (minBottom > item.rectBottom || minBottom === undefined) {
      minBottom = item.rectBottom;
    }

    if (item.rectLeft < minLeft || minLeft === undefined) {
      minLeft = item.rectLeft;
    }
    const rectRight = item.rectLeft + item.width;
    if (maxRight < rectRight || maxRight === undefined) {
      maxRight = rectRight;
    }
  });

  const ratio = sceneWidth / (maxRight - minLeft) * 0.8;
  const halfHorizMargin = horizontalMargin / 100 / 2;
  const halfVertMargin = verticalMargin / 100 / 2;

  data.forEach(item => {
    item.rectTranslateX = (item.rectLeft + halfHorizMargin * item.width) * ratio;
    //item.rectTranslateY = item.rectTop * ratio;
    item.rectTranslateY = (item.rectBottom - halfVertMargin * item.height) * ratio;
    item.adaptFontSize = item.fontSize * ratio;
  });

  const res = {
    maxRight: maxRight * ratio,
    minLeft: minLeft * ratio,
    minBottom: minBottom * ratio,
    maxTop: maxTop * ratio,
    data
  };

  return res;
}

export function randomColor() {
  let r = Math.round(Math.random() * 0xff);
  let g = Math.round(Math.random() * 0xff);
  let b = Math.round(Math.random() * 0xff);
  return `rgb(${r}, ${g}, ${b})`;
}