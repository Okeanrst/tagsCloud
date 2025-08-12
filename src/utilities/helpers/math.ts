export const round = (number: number, accuracy = 2) =>
  accuracy > 0 ? Math.round(number * 10 * accuracy) / (10 * accuracy) : Math.round(number);
