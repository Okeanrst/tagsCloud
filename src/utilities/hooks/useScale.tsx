import { useRef, useEffect, RefObject, useCallback } from 'react';
import { clamp } from 'utilities/helpers/clamp';
import { ScaleT, SizeT } from 'types/types';

type PropsT = {
  targetElementRef: RefObject<HTMLDivElement>;
  setScale: (fn: (scale: ScaleT | null) => ScaleT | null) => void;
  scaleFactor?: number;
  minScale?: number;
  maxScale?: number;
  isDraggable: boolean;
};

const MIN_SCALE = -100;
const MAX_SCALE = 100;
const SCALE_FACTOR = 1.2;

const getScalePoint = ({ x, y }: { x: number; y: number }, size: SizeT) => ({
  x,
  y,
  relativeX: x / size.width,
  relativeY: y / size.height,
});

// calculate the distance between two touch points
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// get the center point between two touch points
const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export function useScale({
  targetElementRef,
  setScale,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
  scaleFactor = SCALE_FACTOR,
  isDraggable,
}: PropsT) {
  const isPinchingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastDragPositionRef = useRef({ x: 0, y: 0 });
  const lastPinchDistanceRef = useRef(0);

  useEffect(() => {
    if (!isDraggable && isDraggingRef.current) {
      isDraggingRef.current = false;
    }
  }, [isDraggable]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      setScale((prevScale) => {
        if (!targetElementRef.current) {
          return prevScale;
        }
        const { value: prevScaleValue = 1 } = prevScale ?? {};

        let nextScaleValue = event.deltaY > 0 ? prevScaleValue / scaleFactor : prevScaleValue * scaleFactor;
        nextScaleValue = clamp(nextScaleValue, minScale, maxScale);

        const rect = targetElementRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        return {
          value: nextScaleValue,
          point: getScalePoint({ x: mouseX, y: mouseY }, rect),
        };
      });
    },
    [maxScale, minScale, scaleFactor, setScale, targetElementRef],
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isDraggable) {
        return;
      }
      event.preventDefault();
      isDraggingRef.current = true;
      lastDragPositionRef.current = { x: event.clientX, y: event.clientY };
    },
    [isDraggable],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current) return;
      event.preventDefault();
      const dx = event.clientX - lastDragPositionRef.current.x;
      const dy = event.clientY - lastDragPositionRef.current.y;

      setScale((prevScale) => {
        if (!targetElementRef.current) {
          return prevScale;
        }

        const rect = targetElementRef.current.getBoundingClientRect();

        const { value: prevScaleValue = 1, point: { x: prevX = 0, y: prevY = 0 } = {} } = prevScale ?? {};

        return {
          value: prevScaleValue,
          point: getScalePoint({ x: prevX - dx, y: prevY - dy }, rect),
        };
      });

      lastDragPositionRef.current = { x: event.clientX, y: event.clientY };
    },
    [setScale, targetElementRef],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length === 1) {
        if (!isDraggable) {
          return;
        }
        isDraggingRef.current = true;
        lastDragPositionRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      } else if (event.touches.length === 2) {
        isDraggingRef.current = false;
        isPinchingRef.current = true;
        lastPinchDistanceRef.current = getDistance(
          { x: event.touches[0].clientX, y: event.touches[0].clientY },
          { x: event.touches[1].clientX, y: event.touches[1].clientY },
        );
      }
    },
    [isDraggable],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!targetElementRef.current) {
        return;
      }

      // Prevents page scroll on mobile
      event.preventDefault();

      const { current: lastPinchDistance } = lastPinchDistanceRef;

      setScale((prevScale) => {
        if (!targetElementRef.current) {
          return prevScale;
        }

        const rect = targetElementRef.current.getBoundingClientRect();

        const { value: prevScaleValue = 1, point: { x: prevX = 0, y: prevY = 0 } = {} } = prevScale ?? {};

        if (isDraggingRef.current && event.touches.length === 1) {
          // Panning with one finger
          const dx = event.touches[0].clientX - lastDragPositionRef.current.x;
          const dy = event.touches[0].clientY - lastDragPositionRef.current.y;
          lastDragPositionRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };

          return {
            value: prevScaleValue,
            point: getScalePoint({ x: prevX - dx, y: prevY - dy }, rect),
          };
        } else if (isPinchingRef.current && event.touches.length === 2) {
          // Pinching with two fingers
          const p1 = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          const p2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
          const nextPinchDistance = getDistance(p1, p2);

          lastPinchDistanceRef.current = nextPinchDistance;

          let nextScaleValue = prevScaleValue * (nextPinchDistance / lastPinchDistance);
          nextScaleValue = clamp(nextScaleValue, minScale, maxScale);

          const center = getCenter(p1, p2);
          const centerX = center.x - rect.left;
          const centerY = center.y - rect.top;

          return { value: nextScaleValue, point: getScalePoint({ x: centerX, y: centerY }, rect) };
        }

        return prevScale;
      });
    },
    [maxScale, minScale, setScale, targetElementRef],
  );

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (event.touches.length < 2) {
      isPinchingRef.current = false;
    }
    if (event.touches.length < 1) {
      isDraggingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const mapElement = targetElementRef.current;
    if (!mapElement) {
      return;
    }

    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    mapElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    mapElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    mapElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    mapElement.addEventListener('touchend', handleTouchEnd);
    mapElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
      mapElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);

      mapElement.removeEventListener('touchstart', handleTouchStart);
      mapElement.removeEventListener('touchmove', handleTouchMove);
      mapElement.removeEventListener('touchend', handleTouchEnd);
      mapElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    handleWheel,
    targetElementRef,
  ]);
}

export const Scale = (props: PropsT) => {
  useScale(props);
  return null;
};
