import {
  type MouseEvent as ReactMouseEvent,
  type Ref,
  RefObject,
  type SyntheticEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import throttle from 'lodash.throttle';
import { formRectAreaMapKey } from 'utilities/prepareRectAreasMaps';
import { getRectAreaOfRectAreaMap } from 'utilities/rectAreaMap/rectAreaMap';
import { calcTagSvgData } from 'utilities/tagsCloud/tagSvgData';
import {
  getSceneMapVacancies,
  releaseRectAreaPositionsOnSceneMap,
  rotateRectArea,
} from 'utilities/positioningAlgorithm/calcTagsPositions';
import type { SceneEdgesT, PositionT as SceneMapPositionT } from 'utilities/positioningAlgorithm/sceneMap';
import type { PositionedTagRectT, IdRectAreaMapT } from 'types/types';
import {
  canvasCoordinatesToSceneCoordinates,
  canvasFrameCoordinatesToCanvasCoordinates,
  documentCoordinatesToCanvasFrameCoordinates,
  getActiveVacanciesByCoordinates,
  getEventDocumentCoordinates,
  limitCoordinatesWithCanvasFrameBoundaries,
  flatVacancies,
  sceneCoordinatesToCanvasCoordinates,
} from './utils';
import { formTagTransformStyle } from './styleUtils';
import type { DraggableTagT } from './types';
import type { FrameOffsetT } from './utils';
import { getFontYFactor } from 'utilities/common/getFontYFactor';

const MOVEMENT_THRESHOLD = 10; // px
const CHANGE_ROTATION_THRESHOLD = 500; // ms

export type DraggableTagAvatarProps = {
  label?: string;
  color?: string;
  fontSize?: number;
  display?: string;
  ref?: Ref<SVGTextElement>;
};

type TagPositionT = PositionedTagRectT;
type TagsPositionsT = ReadonlyArray<TagPositionT> | null;
type RectAreasMapsT = ReadonlyArray<IdRectAreaMapT>;
type SceneMapPositionsT = ReadonlyArray<SceneMapPositionT> | null;

type VacanciesT = Parameters<typeof flatVacancies>[0] | null;

export function useTagDrag(args: {
  isInteractionDisabled: boolean;
  canvasWrapperRef: RefObject<HTMLDivElement | null>;
  canvasFrameOffsetRef: RefObject<FrameOffsetT | null>;
  draggableTagAvatarRef: RefObject<SVGTextElement | null>;
  svgSizeFactorRef: RefObject<number>;
  svgSizeFactor: number;
  scaleRef: RefObject<number>;
  onDragEndRef: RefObject<() => void>;
  sceneMapPositions: SceneMapPositionsT;
  sceneMapEdges: SceneEdgesT | null;
  sceneMapResolution: number;
  tagsPositions: TagsPositionsT;
  rectAreasMaps: RectAreasMapsT;
  vacancies: VacanciesT;
  fontFamily: Parameters<typeof getFontYFactor>[0];
  onTagClick: (id: string) => void;
}) {
  const {
    isInteractionDisabled,
    canvasWrapperRef,
    canvasFrameOffsetRef,
    draggableTagAvatarRef,
    svgSizeFactorRef,
    svgSizeFactor,
    scaleRef,
    onDragEndRef,
    sceneMapPositions,
    sceneMapEdges,
    sceneMapResolution,
    tagsPositions,
    rectAreasMaps,
    vacancies,
    fontFamily,
    onTagClick,
  } = args;

  const preventOnClickHandlingRef = useRef(false);

  const [draggableTag, setDraggableTag] = useState<DraggableTagT | null>(null);
  const [draggableTagPosition, setDraggableTagPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!draggableTag) {
      preventOnClickHandlingRef.current = false;
    }
  }, [draggableTag]);

  const onContextMenu = useCallback((e: SyntheticEvent<EventTarget>) => {
    if (!(e.target instanceof SVGTextElement)) {
      return;
    }
    e.preventDefault();
  }, []);

  const onClick = useCallback(
    (e: SyntheticEvent<EventTarget>) => {
      if (isInteractionDisabled) {
        return;
      }
      if (!(e.target instanceof SVGTextElement)) {
        return;
      }
      const tagId = e.target.dataset.id;
      if (!tagId) {
        return;
      }
      if (!preventOnClickHandlingRef.current) {
        onTagClick(tagId);
      }
    },
    [isInteractionDisabled, onTagClick],
  );

  const onPointerStart = useCallback(
    (event: ReactMouseEvent | ReactTouchEvent) => {
      if (isInteractionDisabled || !canvasFrameOffsetRef.current) {
        return;
      }

      if (!(event.target instanceof SVGTextElement)) {
        return;
      }
      const tagId = event.target.dataset.id;
      if (!draggableTagAvatarRef.current || !tagId || !sceneMapEdges || !tagsPositions) {
        return;
      }

      const tagPosition = tagsPositions.find(({ id }) => id === tagId);
      const { pageX: initPageX, pageY: initPageY } = getEventDocumentCoordinates(event);
      if (!tagPosition || initPageX === null || initPageY === null) {
        return;
      }

      const { x: rectLeftCanvasCoordinate, y: rectTopCanvasCoordinate } = sceneCoordinatesToCanvasCoordinates(
        { x: tagPosition.rectLeft, y: tagPosition.rectTop },
        { sceneMapEdges, svgSizeFactor: svgSizeFactorRef.current, sceneMapResolution },
      );

      const canvasWrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
      if (!canvasWrapperRect) {
        return;
      }

      const initCanvasCoordinates = canvasFrameCoordinatesToCanvasCoordinates({
        coordinates: documentCoordinatesToCanvasFrameCoordinates({ x: initPageX, y: initPageY }, canvasWrapperRect),
        canvasFrameOffset: canvasFrameOffsetRef.current,
        scale: scaleRef.current,
      });

      const shiftX = initCanvasCoordinates.x - rectLeftCanvasCoordinate;
      const shiftY = initCanvasCoordinates.y - rectTopCanvasCoordinate;

      const initTime = Date.now();

      let didDraggingStart = false;
      let changeRotation = false;

      const throttledSetDraggableTagPosition = throttle(setDraggableTagPosition, 100);

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ('touches' in moveEvent && moveEvent.touches.length !== 1) {
          // probably pinching case
          return;
        }

        const { pageX, pageY } = getEventDocumentCoordinates(moveEvent);
        if (pageX === null || pageY === null) {
          return;
        }

        if (!didDraggingStart) {
          didDraggingStart = ((initPageX - pageX) ** 2 + (initPageY - pageY) ** 2) ** 0.5 > MOVEMENT_THRESHOLD;
          if (didDraggingStart) {
            changeRotation = Date.now() - initTime > CHANGE_ROTATION_THRESHOLD;
            setDraggableTag({ id: tagId, changeRotation });
          }
        }

        if (!didDraggingStart) {
          return;
        }

        preventOnClickHandlingRef.current = true;

        if (!draggableTagAvatarRef.current?.style || !canvasFrameOffsetRef.current) {
          return;
        }

        const currentSVGSizeFactor = svgSizeFactorRef.current;
        const scaleValue = scaleRef.current;

        const pointerCanvasCoordinates = canvasFrameCoordinatesToCanvasCoordinates({
          coordinates: limitCoordinatesWithCanvasFrameBoundaries(
            documentCoordinatesToCanvasFrameCoordinates({ x: pageX, y: pageY }, canvasWrapperRect),
            canvasWrapperRect,
          ),
          canvasFrameOffset: canvasFrameOffsetRef.current,
          scale: scaleValue,
        });

        const pointerSceneCoordinates = canvasCoordinatesToSceneCoordinates(pointerCanvasCoordinates, {
          sceneMapEdges,
          svgSizeFactor: currentSVGSizeFactor,
          sceneMapResolution,
        });

        const rotate = changeRotation ? !tagPosition.rotate : tagPosition.rotate;

        const { rectTop, rectBottom, rectLeft, rectRight } = tagPosition;
        const tagAvatarWidth = changeRotation ? rectTop - rectBottom : rectRight - rectLeft;
        const tagAvatarHeight = changeRotation ? rectRight - rectLeft : rectTop - rectBottom;

        const nextRectTop =
          pointerSceneCoordinates.y * sceneMapResolution +
          (changeRotation ? tagAvatarHeight / 2 : shiftY / currentSVGSizeFactor);
        const nextRectLeft =
          pointerSceneCoordinates.x * sceneMapResolution -
          (changeRotation ? tagAvatarWidth / 2 : shiftX / currentSVGSizeFactor);

        const { rectTranslateX, rectTranslateY } = calcTagSvgData(
          {
            glyphsXOffset: tagPosition.glyphsXOffset,
            glyphsYOffset: tagPosition.glyphsYOffset,
            rectTop: nextRectTop,
            rectBottom: nextRectTop - tagAvatarHeight,
            rectLeft: nextRectLeft,
            rectRight: nextRectLeft + tagAvatarWidth,
            rotate,
          },
          getFontYFactor(fontFamily) - 0.5,
        );

        draggableTagAvatarRef.current.style.transform = formTagTransformStyle({
          translateX: rectTranslateX,
          translateY: rectTranslateY,
          isRotated: rotate,
        });
        draggableTagAvatarRef.current.style.display = 'block';

        throttledSetDraggableTagPosition({ x: pointerCanvasCoordinates.x, y: pointerCanvasCoordinates.y });
      };

      const onEnd = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);

        if (!didDraggingStart) {
          return;
        }

        throttledSetDraggableTagPosition.cancel();

        if (draggableTagAvatarRef.current) {
          draggableTagAvatarRef.current.style.display = 'none';
        }

        onDragEndRef.current();
      };

      if ('ontouchstart' in window) {
        document.addEventListener('touchend', onEnd);
        document.addEventListener('touchmove', onMove);
      } else {
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('mousemove', onMove);
      }
    },
    [
      canvasFrameOffsetRef,
      canvasWrapperRef,
      draggableTagAvatarRef,
      fontFamily,
      isInteractionDisabled,
      onDragEndRef,
      sceneMapEdges,
      sceneMapResolution,
      scaleRef,
      svgSizeFactorRef,
      tagsPositions,
    ],
  );

  const tmpVacancies = useMemo(() => {
    if (!draggableTag || !sceneMapPositions || !tagsPositions) {
      return null;
    }

    const tagPosition = tagsPositions.find(({ id }) => id === draggableTag.id);
    if (!tagPosition) {
      return null;
    }

    const rectAreaMapKey = formRectAreaMapKey(tagPosition.label, tagPosition.fontSize);
    const { map: rectAreaMap } = rectAreasMaps.find(({ key }) => key === rectAreaMapKey) ?? {};
    if (!rectAreaMap) {
      return null;
    }

    const sceneMap = releaseRectAreaPositionsOnSceneMap([...sceneMapPositions], tagPosition, rectAreaMap);
    return getSceneMapVacancies(sceneMap);
  }, [draggableTag, rectAreasMaps, sceneMapPositions, tagsPositions]);

  const activeVacancies = useMemo(() => {
    const vacanciesToProcess = tmpVacancies ?? vacancies;
    if (!draggableTagPosition || !draggableTag || !vacanciesToProcess || !sceneMapEdges) {
      return null;
    }
    const tagPosition = tagsPositions?.find(({ id }) => id === draggableTag.id);
    if (!tagPosition) {
      return null;
    }

    const rectAreaMapKey = formRectAreaMapKey(tagPosition.label, tagPosition.fontSize);
    const { map: rectAreaMap } = rectAreasMaps.find(({ key }) => key === rectAreaMapKey) ?? {};
    if (!rectAreaMap) {
      return null;
    }

    const rotate = draggableTag.changeRotation ? !tagPosition.rotate : tagPosition.rotate;
    const tagRectArea = rotate
      ? rotateRectArea(getRectAreaOfRectAreaMap(rectAreaMap))
      : getRectAreaOfRectAreaMap(rectAreaMap);
    if (!tagRectArea) {
      return null;
    }

    const scenePointCoordinates = canvasCoordinatesToSceneCoordinates(draggableTagPosition, {
      sceneMapEdges,
      svgSizeFactor,
      sceneMapResolution,
    });

    return flatVacancies(getActiveVacanciesByCoordinates(scenePointCoordinates, tagRectArea, vacanciesToProcess));
  }, [
    draggableTag,
    draggableTagPosition,
    rectAreasMaps,
    sceneMapEdges,
    sceneMapResolution,
    svgSizeFactor,
    tagsPositions,
    tmpVacancies,
    vacancies,
  ]);

  // Callers may use this to clear draggable state once drop is processed.
  const clearDragState = useCallback(() => {
    setDraggableTagPosition(null);
    setDraggableTag(null);
  }, []);

  const draggableTagAvatarProps: DraggableTagAvatarProps = useMemo(() => {
    if (!draggableTag) {
      return { ref: draggableTagAvatarRef as unknown as Ref<SVGTextElement> };
    }
    const tagPosition = tagsPositions?.find(({ id }) => id === draggableTag.id);
    if (!tagPosition) {
      return { ref: draggableTagAvatarRef as unknown as Ref<SVGTextElement> };
    }
    const { label, color, fontSize } = tagPosition;
    return {
      label,
      color,
      fontSize,
      display: 'block',
      ref: draggableTagAvatarRef as unknown as Ref<SVGTextElement>,
    };
  }, [draggableTag, draggableTagAvatarRef, tagsPositions]);

  return {
    bind: {
      onMouseDown: onPointerStart,
      onTouchStart: onPointerStart,
      onClick,
      onContextMenu,
    },
    draggableTag,
    draggableTagPosition,
    draggableTagAvatarProps,
    activeVacancies,
    clearDragState,
  };
}
