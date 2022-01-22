const validateRGBColor = (color: string) => {
  return /^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/.test(color);
};

export function validateTagCloudRawData(data: unknown): string | null {
  if (!Array.isArray(data)) {
    return 'Not an array';
  }
  const idsSet = new Set();
  try {
    data.forEach((item) => {
      if (!item && typeof item !== 'object') {
        throw new Error('data item is not an object');
      }
      const { id, label, color, sentimentScore } = item;

      if (typeof id !== 'string' || !id) {
        throw new Error('data item id is invalid');
      }
      if (idsSet.has(id)) {
        throw new Error('data item id is duplicated');
      }
      idsSet.add(id);

      if (typeof label !== 'string' || !label.trim()) {
        throw new Error('data item label is invalid');
      }

      if (typeof color !== 'string' || !validateRGBColor(color)) {
        throw new Error('data item color is invalid');
      }

      if (typeof sentimentScore !== 'number' || sentimentScore < 0) {
        throw new Error('data item sentimentScore is invalid');
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      return err.message || 'invalid';
    }
    return 'invalid';
  }

  return null;
}
