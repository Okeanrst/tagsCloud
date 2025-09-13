import { SizeT } from 'types/types';

export const cropSize = ({ size, aspectRatio }: { size: SizeT; aspectRatio: number }): SizeT => {
  const { width: availableWidth, height: availableHeight } = size;
  const possibleSizes = [
    { width: availableWidth, height: availableWidth / aspectRatio },
    { width: availableHeight * aspectRatio, height: availableHeight },
  ];
  return possibleSizes.find(({ width: possibleWidth, height: possibleHeight }) => {
    return possibleWidth <= availableWidth && possibleHeight <= availableHeight;
  }) as SizeT;
};
