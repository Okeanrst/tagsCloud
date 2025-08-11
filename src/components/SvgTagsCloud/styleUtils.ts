export const formTagTransformStyle = ({
  translateX,
  translateY,
  isRotated,
  scale = 1,
}: {
  translateX: number;
  translateY: number;
  isRotated: boolean;
  scale?: number;
}) => {
  return `translate(${translateX}px,${translateY}px) rotate(${isRotated ? 90 : 0}deg) scale(${scale})`;
};
