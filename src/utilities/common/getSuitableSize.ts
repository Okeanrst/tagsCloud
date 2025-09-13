import { SizeT } from 'types/types';
import { cropSize } from './cropSize';

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
