export function prepareData(data, options = {}) {
  const {minFontSize = 6, maxFontSize = 36, horizontalMargin = 5, verticalMargin = 5} = options;

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
  data.forEach(item => {
    ctx.font = `${item.fontSize}px OpenSans`;
    const measure = ctx.measureText(item.label);
    item.width = measure.width * horizMargin;
    //TODO use opentype.js
    item.height = item.fontSize * vertMargin;
    if (item.id === '1751295897__Odessa') {
      console.log('item.width=',item.width)
      console.log('item.height=',item.height)
    }
  });

  return data;
}

export function adaptDataToScene(data, sceneWidth) {
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

  //const ratio = sceneWidth / (maxRight - minLeft);
  const ratio = 1;
  data.forEach(item => {
    item.rectTranslateX = item.rectLeft * ratio;
    //item.rectTranslateY = item.rectTop * ratio;
    item.rectTranslateY = item.rectBottom * ratio;
    item.adaptFontSize = item.fontSize * ratio;
  });

  return {maxRight, minLeft, minBottom, maxTop, data};
}

export function randomColor() {
  let r = Math.round(Math.random() * 0xff);
  let g = Math.round(Math.random() * 0xff);
  let b = Math.round(Math.random() * 0xff);
  //return `rgb(${r}, ${g}, ${b})`;
  return `rgb(1, 0, 0)`;
}