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
  const fontSizeFactor = 1.1;

  data.forEach(item => {
    ctx.font = `${item.fontSize}px OpenSans`;
    const measure = ctx.measureText(item.label);
    item.width = measure.width;

    item.height = item.fontSize * fontSizeFactor;
    item.fill = randomColor();
  });

  return data;
}

export function getBorderCoordinates(data) {
  let maxTop;
  let minBottom;
  let maxRight;
  let minLeft;
  data.forEach(item => {
    if (item.rectTop > maxTop || maxTop === undefined) {
      maxTop = item.rectTop;
    }

    if (minBottom > item.rectBottom || minBottom === undefined) {
      minBottom = item.rectBottom;
    }

    if (item.rectLeft < minLeft || minLeft === undefined) {
      minLeft = item.rectLeft;
    }

    if (maxRight < item.rectRight || maxRight === undefined) {
      maxRight = item.rectRight;
    }
  });

  return {top: maxTop, bottom: minBottom, right: maxRight, left: minLeft};
}

export function calcAllowedWidth(width) {
  const aspectRatio = document.documentElement.clientWidth / document.documentElement.clientHeight;
  let allowedWidth = width * 0.9;
  if (aspectRatio >= 1) {
    allowedWidth = width / aspectRatio * 1.2;
  }
  return allowedWidth;
}

export function adaptDataToScene(data, allowedWidth) {
  const {
    top: maxTop, bottom: minBottom, right: maxRight, left: minLeft
  } = getBorderCoordinates(data);

  const scale = allowedWidth * 0.8 / (maxRight - minLeft) ;

  /*data.forEach(item => {
    item.rectTranslateX = (item.rectLeft) * scale;
    if (item.rotate) {
      item.rectTranslateY = -(item.rectBottom + item.height) * scale
    } else {
      item.rectTranslateY = -(item.rectBottom ) * scale;
    }

    item.adaptFontSize = item.fontSize * scale;
  });*/

  data.forEach(item => {
    const diffX = (item.rectRight - item.rectLeft);
    const diffY = (item.rectTop - item.rectBottom);
    const middleX = item.rectLeft + diffX / 2;
    const middleY = item.rectBottom + diffY / 2;
    
    if (item.rotate) {
      item.rectTranslateX = (middleX - diffX * 0.3) * scale;
      item.rectTranslateY = - (middleY) * scale;
    } else {
      item.rectTranslateX = middleX * scale;
      item.rectTranslateY = -(middleY - diffY * 0.3) * scale;
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