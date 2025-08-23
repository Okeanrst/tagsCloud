import { SizeT } from 'types/types';

export const getSuitableSize = (availableSize: SizeT, aspectRatio: number): SizeT => {
  const { width: availableWidth, height: availableHeight } = availableSize;
  const possibleSizes = [
    { width: availableWidth, height: availableWidth / aspectRatio },
    { width: availableHeight * aspectRatio, height: availableHeight },
  ];
  const suitableSize = possibleSizes.find(({ width: possibleWidth, height: possibleHeight }) => {
    return possibleWidth <= availableWidth && possibleHeight <= availableHeight;
  });
  return suitableSize as SizeT;
};
