import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
  useImperativeHandle,
  MutableRefObject,
  forwardRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import throttle from 'lodash.throttle';
import * as actions from 'store/actions/tagsCloud';
import { noop } from 'utilities/noop';
import { getTagsSvgData, calcTagSvgData } from 'utilities/tagsCloud/tagSvgData';
import { getSuitableSize } from 'utilities/common/getSuitableSize';
import {
  getSceneMapVacancies,
  releaseRectAreaPositionsOnSceneMap,
  rotateRectArea,
} from 'utilities/positioningAlgorithm/calcTagsPositions';
import { SceneMap } from 'utilities/positioningAlgorithm/sceneMap';
import { formRectAreaMapKey } from 'utilities/prepareRectAreasMaps';
import { getRectAreaOfRectAreaMap } from 'utilities/rectAreaMap/rectAreaMap';
import { getFontYFactor } from 'utilities/common/getFontYFactor';
import { exportTagCloudAsHtml } from 'utilities/common/exportTagCloudAsHtml';
import { getAspectRatio } from 'utilities/common/getAspectRatio';
import { useObjectRef } from 'utilities/hooks/useObjectRef';
import { RootStateT } from 'store/types';
import { Tags } from './Tags';
import { Vacancies } from './Vacancies';
import { CoordinateGrid } from './CoordinateGrid';
import { ReactAreas } from './ReactAreas';
import {
  downloadTagCloudHtmlFile,
  getEventDocumentCoordinates,
  getActiveVacanciesByCoordinates,
  canvasCoordinatesToSceneCoordinates,
  documentCoordinatesToCanvasFrameCoordinates,
  limitCoordinatesWithCanvasFrameBoundaries,
  sortActiveVacancies,
  sceneCoordinatesToCanvasCoordinates,
  calcSVGSizeFactor,
  getSVGViewBox,
  canvasFrameCoordinatesToCanvasCoordinates,
  getCanvasFrameOffset,
} from './utils';
import { formTagTransformStyle } from './styleUtils';
import { TAG_AVATAR_CANVAS_DEFAULT_Z_INDEX, TAG_AVATAR_CANVAS_Z_INDEX } from './constants';
import { ScaleT, RenderSceneT } from 'types/types';
import { DraggableTagT, VacanciesT } from './types';
import { FrameOffsetT } from './utils';

type PropsT = {
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  downloadCloudCounter: number;
  isVacanciesShown: boolean;
  isReactAreasShown: boolean;
  isCoordinateGridShown: boolean;
  scale: number;
  renderScene: RenderSceneT;
  isTagsCloudInteractionDisabled: boolean;
};

const MOVEMENT_THRESHOLD = 10; // px
const CHANGE_ROTATION_THRESHOLD = 500; // ms

const DEFAULT_RENDER_SCENE_KEY = 'normal';

const useStyles = makeStyles({
  container: {
    width: '100%',
    textAlign: 'center',
  },
  tagAvatarCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: TAG_AVATAR_CANVAS_Z_INDEX,
    'white-space': 'pre',
    'user-select': 'none',
    cursor: 'grabbing',
  },
  canvasWrapper: {
    display: 'inline-block',
    position: 'relative',
    touchAction: 'none',
  },
});

type DraggableTagAvatarProps = {
  label?: string;
  color?: string;
  fontSize?: number;
  display?: string;
};

const DraggableTagAvatar = React.forwardRef<SVGTextElement, DraggableTagAvatarProps>((props, ref) => {
  const { label = '', color = 'black', fontSize = 8, display = 'none' } = props;
  return (
    <text ref={ref} style={{ fill: color, fontSize, display }} textAnchor="middle">
      {label}
    </text>
  );
});

const useCounterChanged = ({
  counter,
  callbackRef,
}: {
  counter: number;
  callbackRef: MutableRefObject<() => void>;
}) => {
  const counterRef = useRef(counter);

  useEffect(() => {
    if (counter !== counterRef.current) {
      counterRef.current = counter;
      callbackRef.current();
    }
  }, [counter, callbackRef]);
};

const stateSelector = (state: RootStateT) => {
  const {
    tagsCloud: { tagsPositions, vacancies, sceneMap: sceneMapPositions },
    rectAreasMapsData: rectAreasMaps,
    settings: { fontFamily, sceneMapResolution, tagByTagRenderInterval },
  } = state;
  return {
    tagsPositions,
    vacancies,
    rectAreasMaps,
    sceneMapPositions,
    fontFamily,
    sceneMapResolution,
    tagByTagRenderInterval,
  };
};

const getRenderSceneKey = (scale: ScaleT | null) => {
  if (!scale || scale.value === 1) {
    return DEFAULT_RENDER_SCENE_KEY;
  }
  return JSON.stringify(scale);
};

const SvgTagsCloud = forwardRef<{ oneByOne: () => void }, PropsT>(
  (
    {
      width,
      height,
      onTagClick,
      downloadCloudCounter,
      isCoordinateGridShown,
      isReactAreasShown,
      isVacanciesShown,
      scale,
      renderScene,
      isTagsCloudInteractionDisabled,
    },
    ref,
  ) => {
    const {
      tagsPositions,
      vacancies,
      rectAreasMaps,
      sceneMapPositions,
      fontFamily,
      sceneMapResolution,
      tagByTagRenderInterval,
    } = useSelector(stateSelector);
    const dispatch = useDispatch();

    const canvasFrameOffset = useRef<FrameOffsetT | null>(null);
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const draggableTagAvatarRef = useRef<SVGTextElement | null>(null);
    const preventOnClickHandlingRef = useRef<boolean>(false);
    const handleMouseUpEventRef = useRef(() => {});
    const svgSizeFactorRef = useRef(1);
    const downloadTagCloudRef = useRef(() => {});

    const [tagEndIndexToShow, setTagEndIndexToShow] = useState<number>(-1);

    useImperativeHandle(
      ref,
      () => ({
        oneByOne: () => {
          setTagEndIndexToShow(1);
        },
      }),
      [],
    );

    const classes = useStyles({ fontFamily });

    const [draggableTag, setDraggableTag] = useState<DraggableTagT | null>(null);
    const [draggableTagPosition, setDraggableTagPosition] = useState<{ x: number; y: number } | null>(null);
    const [tmpVacancies, setTmpVacancies] = useState<VacanciesT | null>(null);

    useCounterChanged({ counter: downloadCloudCounter, callbackRef: downloadTagCloudRef });

    const scaleRef = useObjectRef<number>(scale);

    useEffect(() => {
      if (!draggableTag || !sceneMapPositions) {
        setTmpVacancies(null);
        return;
      }
      const tagPosition = tagsPositions?.find(({ id }) => id === draggableTag.id);
      if (!tagPosition) {
        setTmpVacancies(null);
        return;
      }

      const rectAreaMapKey = formRectAreaMapKey(tagPosition.label, tagPosition.fontSize);

      const { map: rectAreaMap } = rectAreasMaps.find(({ key }) => key === rectAreaMapKey) ?? {};

      if (!rectAreaMap) {
        setTmpVacancies(null);
        return;
      }
      const sceneMap = releaseRectAreaPositionsOnSceneMap(sceneMapPositions, tagPosition, rectAreaMap);

      setTmpVacancies(getSceneMapVacancies(sceneMap));
    }, [sceneMapPositions, draggableTag, rectAreasMaps, tagsPositions]);

    useEffect(() => {
      if (!draggableTag) {
        preventOnClickHandlingRef.current = false;
      }
    }, [draggableTag]);

    const sceneMapEdges = useMemo(() => {
      if (!sceneMapPositions) {
        return null;
      }
      return new SceneMap(sceneMapPositions).getSceneEdges();
    }, [sceneMapPositions]);

    const tagsSvgData = useMemo(() => {
      if (!tagsPositions) {
        return;
      }
      const sortedTagsPositions = [...tagsPositions].sort((a, b) => b.fontSize - a.fontSize);
      return getTagsSvgData(sortedTagsPositions, { fontFamily });
    }, [tagsPositions, fontFamily]);

    const allVacancies = useMemo(() => {
      if (!vacancies || !isVacanciesShown) {
        return null;
      }
      return sortActiveVacancies(vacancies);
    }, [vacancies, isVacanciesShown]);

    const tagsCount = tagsSvgData?.data?.length ?? 0;

    useEffect(() => {
      if (!tagsCount || tagEndIndexToShow === -1) {
        return;
      }
      if (tagEndIndexToShow >= tagsCount) {
        setTagEndIndexToShow(-1);
      }
      const timeout = setTimeout(() => {
        setTagEndIndexToShow((v) => v + 1);
      }, tagByTagRenderInterval * 100);
      return () => {
        clearTimeout(timeout);
      };
    }, [tagsCount, tagEndIndexToShow, tagByTagRenderInterval]);

    const onContextMenu = useCallback((e: React.SyntheticEvent<EventTarget>) => {
      if (!(e.target instanceof SVGTextElement)) {
        return;
      }
      e.preventDefault();
    }, []);

    const onCanvasWrapperClick = useCallback(
      (e: React.SyntheticEvent<EventTarget>) => {
        if (isTagsCloudInteractionDisabled) {
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
      [isTagsCloudInteractionDisabled, onTagClick],
    );

    const onCanvasWrapperMouseDown = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (isTagsCloudInteractionDisabled || !canvasFrameOffset.current) {
          return;
        }

        if (!(event.target instanceof SVGTextElement)) {
          return;
        }
        const tagId = event.target.dataset.id;
        if (!draggableTagAvatarRef.current || !tagId || !sceneMapEdges) {
          return;
        }

        const tagPosition = tagsPositions?.find(({ id }) => id === tagId);

        const { pageX: initPageX, pageY: initPageY } = getEventDocumentCoordinates(event);

        if (!tagPosition || initPageX === null || initPageY === null) {
          return;
        }

        const { x: rectLeftCanvasCoordinate, y: rectTopCanvasCoordinate } = sceneCoordinatesToCanvasCoordinates(
          {
            x: tagPosition.rectLeft,
            y: tagPosition.rectTop,
          },
          { sceneMapEdges, svgSizeFactor: svgSizeFactorRef.current, sceneMapResolution },
        );

        const canvasWrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
        if (!canvasWrapperRect) {
          return;
        }

        const initCanvasCoordinates = canvasFrameCoordinatesToCanvasCoordinates({
          coordinates: documentCoordinatesToCanvasFrameCoordinates(
            {
              x: initPageX,
              y: initPageY,
            },
            canvasWrapperRect,
          ),
          canvasFrameOffset: canvasFrameOffset.current,
          scale: scaleRef.current,
        });

        const shiftX = initCanvasCoordinates.x - rectLeftCanvasCoordinate;
        const shiftY = initCanvasCoordinates.y - rectTopCanvasCoordinate;

        const initTime = Date.now();

        let didDraggingStart = false;
        let changeRotation = false;

        const throttledSetDraggableTagPosition = throttle(setDraggableTagPosition, 100);

        const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
          if ('touches' in event && event.touches.length !== 1) {
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

          if (
            !draggableTagAvatarRef.current ||
            !draggableTagAvatarRef.current.style ||
            !sceneMapEdges ||
            !canvasFrameOffset.current
          ) {
            return;
          }

          const { current: currentSVGSizeFactor } = svgSizeFactorRef;
          const scaleValue = scaleRef.current;

          const pointerCanvasCoordinates = canvasFrameCoordinatesToCanvasCoordinates({
            coordinates: limitCoordinatesWithCanvasFrameBoundaries(
              documentCoordinatesToCanvasFrameCoordinates(
                {
                  x: pageX,
                  y: pageY,
                },
                canvasWrapperRect,
              ),
              canvasWrapperRect,
            ),
            canvasFrameOffset: canvasFrameOffset.current,
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
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          document.removeEventListener('touchmove', onMouseMove);
          document.removeEventListener('touchend', onMouseUp);

          if (!didDraggingStart) {
            return;
          }

          throttledSetDraggableTagPosition.cancel();

          if (draggableTagAvatarRef.current) {
            draggableTagAvatarRef.current.style.display = 'none';
          }

          handleMouseUpEventRef.current();
        };

        if ('ontouchstart' in window) {
          document.addEventListener('touchend', onMouseUp);
          document.addEventListener('touchmove', onMouseMove);
        } else {
          document.addEventListener('mouseup', onMouseUp);
          document.addEventListener('mousemove', onMouseMove);
        }
      },
      [isTagsCloudInteractionDisabled, sceneMapEdges, tagsPositions, sceneMapResolution, scaleRef, fontFamily],
    );

    const isDataReady = !!(tagsPositions && tagsSvgData);

    if (!isDataReady) {
      handleMouseUpEventRef.current = noop;
      downloadTagCloudRef.current = noop;

      return null;
    }

    const { viewBox: fullSceneViewBox, transform, aspectRatio, data: positionedTagSvgData } = tagsSvgData;

    const svgSize = getSuitableSize({ availableSize: { width, height }, aspectRatio, scale });

    const viewBox = getSVGViewBox({ fullSceneViewBox, renderScene });

    const svgSizeFactor = calcSVGSizeFactor(svgSize, fullSceneViewBox) ?? 1;
    svgSizeFactorRef.current = svgSizeFactor;

    canvasFrameOffset.current = getCanvasFrameOffset(fullSceneViewBox, viewBox, svgSizeFactor);

    const activeVacancies = (() => {
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

      return sortActiveVacancies(
        getActiveVacanciesByCoordinates(scenePointCoordinates, tagRectArea, vacanciesToProcess),
      );
    })();

    handleMouseUpEventRef.current = () => {
      setDraggableTagPosition(null);
      setDraggableTag(null);

      if (!activeVacancies || !activeVacancies.length || !draggableTag) {
        return;
      }

      const { vacancy: targetVacancy, kind: targetVacancyKind } = activeVacancies[0] ?? {};

      if (targetVacancy && targetVacancyKind) {
        const { id: tagId, changeRotation } = draggableTag;
        const currentTagPosition = tagsPositions?.find(({ id }) => id === tagId);
        if (!currentTagPosition) {
          return;
        }
        dispatch(
          actions.changeTagPosition({
            tagId,
            vacancy: targetVacancy,
            vacancyKind: targetVacancyKind,
            isRotated: changeRotation ? !currentTagPosition.rotate : currentTagPosition.rotate,
          }),
        );
      }
    };

    downloadTagCloudRef.current = () => {
      const html = exportTagCloudAsHtml({
        tagsSvgData: positionedTagSvgData,
        svgSize,
        viewBox: fullSceneViewBox,
        transform,
        fontFamily,
      });
      downloadTagCloudHtmlFile(html);
    };

    const draggableTagAvatarProps = (() => {
      if (!draggableTag) {
        return {};
      }
      const tagPosition = tagsPositions?.find(({ id }) => id === draggableTag.id);
      if (!tagPosition) {
        return {};
      }

      const { label, color, fontSize } = tagPosition;
      return { label, color, fontSize, display: 'block' };
    })();

    return (
      <div className={classes.container}>
        <div
          className={classes.canvasWrapper}
          ref={canvasWrapperRef}
          onClick={onCanvasWrapperClick}
          onContextMenu={onContextMenu}
          {...('ontouchstart' in window
            ? { onTouchStart: onCanvasWrapperMouseDown }
            : { onMouseDown: onCanvasWrapperMouseDown })}
        >
          {isCoordinateGridShown && (
            <CoordinateGrid
              fullSceneViewBox={fullSceneViewBox}
              sceneMapResolution={sceneMapResolution}
              svgSize={svgSize}
              svgSizeFactor={svgSizeFactor}
              tagsPositions={tagsPositions}
              viewBox={viewBox}
            />
          )}
          {isReactAreasShown && (
            <ReactAreas
              svgSize={svgSize}
              svgSizeFactor={svgSizeFactor}
              tagData={tagsPositions}
              transform={transform}
              viewBox={viewBox}
            />
          )}
          <Tags
            draggableTag={draggableTag}
            fontFamily={fontFamily}
            isTagDraggingDisabled={isTagsCloudInteractionDisabled}
            positionedTagSvgData={positionedTagSvgData}
            svgSize={svgSize}
            tagEndIndexToShow={tagEndIndexToShow}
            transform={transform}
            viewBox={viewBox}
          />
          <Vacancies
            sceneMapEdges={sceneMapEdges}
            sceneMapResolution={sceneMapResolution}
            svgSize={svgSize}
            transform={transform}
            vacancies={activeVacancies}
            viewBox={viewBox}
          />
          <Vacancies
            sceneMapEdges={sceneMapEdges}
            sceneMapResolution={sceneMapResolution}
            svgSize={svgSize}
            transform={transform}
            vacancies={allVacancies}
            viewBox={viewBox}
          />
          <svg
            {...svgSize}
            className={classes.tagAvatarCanvas}
            style={{ zIndex: draggableTag ? TAG_AVATAR_CANVAS_Z_INDEX : TAG_AVATAR_CANVAS_DEFAULT_Z_INDEX }}
            viewBox={viewBox.join(' ')}
          >
            <g transform={transform}>
              <DraggableTagAvatar ref={draggableTagAvatarRef} {...draggableTagAvatarProps} />
            </g>
          </svg>
        </div>
      </div>
    );
  },
);

export default SvgTagsCloud;
