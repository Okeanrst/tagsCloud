export function prepareData(data, options = {}) {
  const {minFontSize = 5, horizontalMargin = 5, verticalMargin = 5} = options;
  //ранжирует данные, определяет размер шрифта (точнее вертикальный размер строки)
  //рассчитывает длину строки
  //на входе нуждается
  //[{id, label, sentiment: {positive, neutral, negative}}]
  //на выходе
  //[{rectWidth, rectHeight}]
  return data;
}

export function scaleData(data) {
  return data;
}

export function randomColor() {
  let r = Math.round(Math.random() * 0xff);
  let g = Math.round(Math.random() * 0xff);
  let b = Math.round(Math.random() * 0xff);
  return r << 16 | g << 8 | b;
}