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

export const getSuitableSize = ({
  availableSize,
  aspectRatio,
  scale = 1,
}: {
  availableSize: SizeT;
  aspectRatio: number;
  scale?: number;
}): SizeT => {
  const suitableSize = cropSize({ size: availableSize, aspectRatio });

  // return suitableSize;
  if (scale <= 1) {
    return suitableSize;
  }

  const { width: availableWidth, height: availableHeight } = availableSize;

  const scaleX = availableWidth / suitableSize.width;
  const scaleY = availableHeight / suitableSize.height;
  const suitableScale = Math.min(Math.max(scaleX, scaleY), scale);

  return {
    width: Math.min(suitableSize.width * suitableScale, availableWidth),
    height: Math.min(suitableSize.height * suitableScale, availableHeight),
  };
};
