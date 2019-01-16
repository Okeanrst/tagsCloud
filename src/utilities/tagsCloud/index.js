export function prepareData(data, options = {}) {
  const { minFontSize = 6, maxFontSize = 36 } = options;

  let minRating;
  let maxRating;
  data.forEach(item => {
    if (minRating > item.sentimentScore || minRating === undefined) {
      minRating = item.sentimentScore;
    }
    if (maxRating < item.sentimentScore || maxRating === undefined) {
      maxRating = item.sentimentScore;
    }
  });

  const ratio = (maxFontSize - minFontSize) / (maxRating - minRating);
  data.forEach(item => item.fontSize = minFontSize + Math.round((item.sentimentScore - minRating) * ratio));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  //TODO use opentype.js
  const fontSizeFactor = 1.12;

  data.forEach(item => {
    ctx.font = `${item.fontSize}px OpenSans`;
    const measure = ctx.measureText(item.label);
    item.width = measure.width;

    item.height = item.fontSize * fontSizeFactor;
    item.fill = randomColor();
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

  const scale = sceneWidth * 0.8 / (maxRight - minLeft) ;

  data.forEach(item => {
    item.rectTranslateX = (item.rectLeft) * scale;
    if (item.rotate) {
      item.rectTranslateY = -(item.rectBottom + item.height) * scale
    } else {
      item.rectTranslateY = -(item.rectBottom ) * scale;
    }

    item.adaptFontSize = item.fontSize * scale;
  });

  const res = {
    maxRight: maxRight * scale,
    minLeft: minLeft * scale,
    minBottom: minBottom * scale,
    maxTop: maxTop * scale,
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