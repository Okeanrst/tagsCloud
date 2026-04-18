export function getRandomRGBColor(): string {
  const r = Math.round(Math.random() * 0xff);
  const g = Math.round(Math.random() * 0xff);
  const b = Math.round(Math.random() * 0xff);
  return `rgb(${r},${g},${b})`;
}
