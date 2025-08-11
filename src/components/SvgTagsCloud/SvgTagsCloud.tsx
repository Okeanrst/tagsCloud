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
import { saveAs } from 'file-saver';
import * as actions from 'store/actions/tagsCloud';
import { getTagsSvgData, calcTagSvgData } from 'utilities/tagsCloud/tagSvgData';
import { getBorderCoordinates } from 'utilities/tagsCloud/getBorderCoordinates';
import { getSuitableSize } from 'utilities/tagsCloud/getSuitableSize';
import {
  getSceneMapVacancies,
  isVacancyLargeEnoughToFitRect,
  releaseRectAreaPositionsOnSceneMap,
  rotateRectArea,
} from 'utilities/positioningAlgorithm/calcTagsPositions';
import { SceneMap, Dimensions } from 'utilities/positioningAlgorithm/sceneMap';
import { formRectAreaMapKey } from 'utilities/prepareRectAreasMaps';
import { getRectAreaOfRectAreaMap } from 'utilities/rectAreaMap/rectAreaMap';
import { VacanciesManager } from 'utilities/positioningAlgorithm/vacanciesManager';
import { getFontYFactor } from 'utilities/common/getFontYFactor';
import { exportTagCloudAsHtml } from 'utilities/common/exportTagCloudAsHtml';
import type { PositionedTagRectT, RectAreaT } from 'types/types';
import type { SizeT } from 'utilities/tagsCloud/getSuitableSize';
import type { ViewBoxT } from 'utilities/tagsCloud/tagSvgData';
import { RootStateT } from 'store/types';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { SceneEdgesT } from 'utilities/positioningAlgorithm/sceneMap';
import { Tags } from './Tags';
import { formTagTransformStyle } from './styleUtils';
import {
  TAG_AVATAR_CANVAS_DEFAULT_Z_INDEX,
  COORDINATE_GRID_CANVAS_Z_INDEX,
  REACT_AREAS_CANVAS_Z_INDEX,
  TAG_AVATAR_CANVAS_Z_INDEX,
} from './constants';
import { DraggableTagT } from './types';

type PropsT = {
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  downloadCloudCounter: number;
  isVacanciesShown: boolean;
  isReactAreasShown: boolean;
  isCoordinateGridShown: boolean;
};

type CoordinatesT = { x: number; y: number };

type VacanciesT = NonNullable<RootStateT['tagsCloud']['vacancies']>;

const MOVEMENT_THRESHOLD = 10; // px
const CHANGE_ROTATION_THRESHOLD = 500; // ms

const getEventDocumentCoordinates = (
  event:
    | MouseEvent
    | TouchEvent
    | React.MouseEvent
    | React.TouchEvent
    | React.SyntheticEvent<any, MouseEvent>
    | React.SyntheticEvent<any, TouchEvent> /* React.MouseEvent | React.TouchEvent*/,
) => {
  let pageX: number | null = null;
  let pageY: number | null = null;
  if (event instanceof MouseEvent) {
    ({ pageX, pageY } = event);
  } else if (window.TouchEvent && event instanceof TouchEvent) {
    ({ pageX, pageY } = event.touches[0]);
  } else if ('nativeEvent' in event && event.nativeEvent instanceof MouseEvent) {
    // @ts-ignore
    ({ pageX, pageY } = event);
  } else if ('nativeEvent' in event && window.TouchEvent && event.nativeEvent instanceof TouchEvent) {
    // @ts-ignore
    ({ pageX, pageY } = event.touches[0]);
  }
  return { pageX, pageY };
};

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
    cursor: 'pointer',
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

const downloadTagCloudHtmlFile = (html: string, fileName?: string) => {
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8',
  });
  saveAs(blob, fileName ?? 'tagCloud.html');
};

const DraggableTagAvatar = React.forwardRef<SVGTextElement, DraggableTagAvatarProps>((props, ref) => {
  const { label = '', color = 'black', fontSize = 8, display = 'none' } = props;
  return (
    <text ref={ref} style={{ fill: color, fontSize, display }} textAnchor="middle">
      {label}
    </text>
  );
});

const activeVacanciesStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
};

const renderVacancyRect = (
  vacancy: VacancyT,
  sceneMapEdges: SceneEdgesT,
  { kind, importanceIndex, sceneMapResolution }: { kind: string; importanceIndex: number; sceneMapResolution: number },
) => {
  // when the coordinate is not defined, then it is a vacancy on the edge (an edge vacancy)
  const left = Number.isFinite(vacancy.left) ? vacancy.left : sceneMapEdges[Dimensions.MINUS_X];
  const right = Number.isFinite(vacancy.right) ? vacancy.right : sceneMapEdges[Dimensions.X];
  const top = Number.isFinite(vacancy.top) ? vacancy.top : sceneMapEdges[Dimensions.Y];
  const bottom = Number.isFinite(vacancy.bottom) ? vacancy.bottom : sceneMapEdges[Dimensions.MINUS_Y];

  if (left > right || top < bottom) {
    // the case when vacancy is outside the scene
    return null;
  }

  return (
    <rect
      fill="purple"
      fillOpacity="0"
      height={SceneMap.countPositions(bottom, top) * sceneMapResolution}
      key={`${left},${right},${top},${bottom},${kind}`}
      stroke="blue"
      strokeOpacity="0.25"
      strokeWidth={importanceIndex === 0 ? 1 : 0.5}
      width={SceneMap.countPositions(left, right) * sceneMapResolution}
      x={SceneMap.getPositionLeftEdge(left) * sceneMapResolution}
      y={-SceneMap.getPositionRightEdge(top) * sceneMapResolution}
    />
  );
};

type ActiveVacanciesPropsT = {
  sceneMapEdges: SceneEdgesT | null;
  vacancies: { vacancy: VacancyT; kind: VacancyKinds }[] | null;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  transform: string;
  sceneMapResolution: number;
};
const Vacancies = ({
  sceneMapEdges,
  vacancies,
  svgSize,
  viewBox,
  transform,
  sceneMapResolution,
}: ActiveVacanciesPropsT) => {
  const rects: React.ReactNode[] = [];
  if (vacancies && sceneMapEdges) {
    vacancies.forEach(({ vacancy, kind }) => {
      rects.push(
        renderVacancyRect(vacancy, sceneMapEdges, { kind, importanceIndex: rects.length, sceneMapResolution }),
      );
    });
  }

  return (
    <svg {...svgSize} style={activeVacanciesStyle} viewBox={viewBox.join(' ')}>
      <g transform={transform}>{rects}</g>
    </svg>
  );
};

const getActiveVacanciesByCoordinates = (
  point: CoordinatesT,
  rectArea: RectAreaT,
  vacancies: VacanciesT,
): VacanciesT => {
  const { closedVacancies, topEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies, rightEdgeVacancies } = vacancies;

  function processVacancies<T extends VacancyT>(vacanciesToProcess: T[]) {
    const suitableVacancies: T[] = [];
    vacanciesToProcess.forEach((vacancy) => {
      if (!vacancy || !VacanciesManager.checkIsPointBelongToVacancy(point, vacancy)) {
        return;
      }
      if (!isVacancyLargeEnoughToFitRect(rectArea, vacancy)) {
        return;
      }
      // check is big enough
      suitableVacancies.push(vacancy);
    });
    return suitableVacancies;
  }

  return {
    closedVacancies: processVacancies(closedVacancies),
    topEdgeVacancies: processVacancies(topEdgeVacancies),
    bottomEdgeVacancies: processVacancies(bottomEdgeVacancies),
    leftEdgeVacancies: processVacancies(leftEdgeVacancies),
    rightEdgeVacancies: processVacancies(rightEdgeVacancies),
  };
};

const sortActiveVacancies = (vacancies: VacanciesT) => {
  const sortedVacancies: { vacancy: VacancyT; kind: VacancyKinds }[] = [];
  for (let kind of Object.values(VacancyKinds)) {
    sortedVacancies.push(...vacancies[kind].map((vacancy) => ({ vacancy, kind })));
  }
  return sortedVacancies;
};

const documentCoordinatesToCanvasCoordinates = (
  documentCoordinates: CoordinatesT,
  canvasRect: DOMRect,
): CoordinatesT => {
  const { top, left } = canvasRect;
  return { x: documentCoordinates.x - left, y: documentCoordinates.y - top };
};

const limitCoordinatesWithCanvasBoundaries = (coordinates: CoordinatesT, canvasRect: DOMRect): CoordinatesT => {
  const { width, height } = canvasRect;
  const { x, y } = coordinates;
  return {
    x: Math.min(Math.max(0, x), width),
    y: Math.min(Math.max(0, y), height),
  };
};

const canvasCoordinatesToSceneCoordinates = (
  canvasCoordinates: CoordinatesT,
  { sceneMapEdges, zoom, sceneMapResolution }: { sceneMapEdges: SceneEdgesT; zoom: number; sceneMapResolution: number },
) => {
  const { x, y } = canvasCoordinates;

  return {
    x: (x / zoom + sceneMapEdges[Dimensions.MINUS_X] * sceneMapResolution) / sceneMapResolution,
    y: (sceneMapEdges[Dimensions.Y] * sceneMapResolution - y / zoom) / sceneMapResolution,
  };
};

const sceneCoordinatesToCanvasCoordinates = (
  sceneCoordinates: CoordinatesT,
  { sceneMapEdges, zoom, sceneMapResolution }: { sceneMapEdges: SceneEdgesT; zoom: number; sceneMapResolution: number },
) => {
  const { x, y } = sceneCoordinates;

  return {
    x: (x - sceneMapEdges[Dimensions.MINUS_X] * sceneMapResolution) * zoom,
    y: (sceneMapEdges[Dimensions.Y] * sceneMapResolution - y) * zoom,
  };
};

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

const SvgTagsCloud = forwardRef<{ play: () => void }, PropsT>(
  (
    { width, height, onTagClick, downloadCloudCounter, isCoordinateGridShown, isReactAreasShown, isVacanciesShown },
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

    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const draggableTagAvatarRef = useRef<SVGTextElement | null>(null);
    const preventOnClickHandlingRef = useRef<boolean>(false);
    const handleMouseUpEventRef = useRef(() => {});
    const zoomRef = useRef(1);
    const downloadTagCloudRef = useRef(() => {});

    const [tagEndIndexToShow, setTagEndIndexToShow] = useState<number>(-1);

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
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
      [onTagClick],
    );

    const onCanvasWrapperMouseDown = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!(e.target instanceof SVGTextElement)) {
          return;
        }
        const tagId = e.target.dataset.id;
        if (!draggableTagAvatarRef.current || !tagId || !sceneMapEdges) {
          return;
        }

        const tagPosition = tagsPositions?.find(({ id }) => id === tagId);

        const { pageX: initPageX, pageY: initPageY } = getEventDocumentCoordinates(e);

        if (!tagPosition || initPageX === null || initPageY === null) {
          return;
        }

        const { x: rectLeftCanvasCoordinate, y: rectTopCanvasCoordinate } = sceneCoordinatesToCanvasCoordinates(
          {
            x: tagPosition.rectLeft,
            y: tagPosition.rectTop,
          },
          { sceneMapEdges, zoom: zoomRef.current, sceneMapResolution },
        );

        const canvasWrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
        if (!canvasWrapperRect) {
          return;
        }

        const initCanvasCoordinates = documentCoordinatesToCanvasCoordinates(
          {
            x: initPageX,
            y: initPageY,
          },
          canvasWrapperRect,
        );

        const shiftX = initCanvasCoordinates.x - rectLeftCanvasCoordinate;
        const shiftY = initCanvasCoordinates.y - rectTopCanvasCoordinate;

        const initTime = Date.now();

        let didDraggingStart = false;
        let changeRotation = false;

        const throttledSetDraggableTagPosition = throttle(setDraggableTagPosition, 100);

        const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
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

          if (!draggableTagAvatarRef.current || !draggableTagAvatarRef.current.style || !sceneMapEdges) {
            return;
          }

          const canvasCoordinates = documentCoordinatesToCanvasCoordinates(
            {
              x: pageX,
              y: pageY,
            },
            canvasWrapperRect,
          );

          const pointerCanvasCoordinates = limitCoordinatesWithCanvasBoundaries(canvasCoordinates, canvasWrapperRect);

          const currentZoom = zoomRef.current;

          const pointerSceneCoordinates = canvasCoordinatesToSceneCoordinates(pointerCanvasCoordinates, {
            sceneMapEdges,
            zoom: currentZoom,
            sceneMapResolution,
          });
          const fontYFactor = getFontYFactor(fontFamily);

          const rotate = changeRotation ? !tagPosition.rotate : tagPosition.rotate;

          const { rectTop, rectBottom, rectLeft, rectRight } = tagPosition;
          const tagAvatarWidth = changeRotation ? rectTop - rectBottom : rectRight - rectLeft;
          const tagAvatarHeight = changeRotation ? rectRight - rectLeft : rectTop - rectBottom;

          const nextRectTop =
            pointerSceneCoordinates.y * sceneMapResolution +
            (changeRotation ? tagAvatarHeight / 2 : shiftY / currentZoom);
          const nextRectLeft =
            pointerSceneCoordinates.x * sceneMapResolution -
            (changeRotation ? tagAvatarWidth / 2 : shiftX / currentZoom);

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
            fontYFactor - 0.5,
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

        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('touchend', onMouseUp);
        document.addEventListener('touchmove', onMouseMove);
      },
      [tagsPositions, sceneMapEdges, fontFamily, sceneMapResolution],
    );

    if (!tagsPositions || !tagsSvgData) {
      return null;
    }

    const { viewBox, transform, aspectRatio, data: positionedTagSvgData } = tagsSvgData;

    const svgSize = getSuitableSize({ width, height }, aspectRatio);

    const zoom = calcZoom(svgSize, viewBox) ?? 1;
    zoomRef.current = zoom;

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
        zoom,
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

    downloadTagCloudRef.current = () => {
      const html = exportTagCloudAsHtml({ tagsSvgData: positionedTagSvgData, svgSize, viewBox, transform, fontFamily });
      downloadTagCloudHtmlFile(html);
    };

    return (
      <div className={classes.container}>
        <div
          className={classes.canvasWrapper}
          ref={canvasWrapperRef}
          onClick={onCanvasWrapperClick}
          onContextMenu={onContextMenu}
          onMouseDown={onCanvasWrapperMouseDown}
          onTouchStart={onCanvasWrapperMouseDown}
        >
          {isCoordinateGridShown && drawCoordinateGrid({ tagsPositions, svgSize, viewBox, sceneMapResolution })}
          {isReactAreasShown && drawReactAreas(tagsPositions, svgSize, viewBox, transform)}
          <Tags
            draggableTag={draggableTag}
            fontFamily={fontFamily}
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

const coordinateGridCanvasStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
  zIndex: COORDINATE_GRID_CANVAS_Z_INDEX,
};

function drawCoordinateGrid({
  tagsPositions,
  svgSize,
  viewBox,
  sceneMapResolution,
}: {
  tagsPositions: ReadonlyArray<PositionedTagRectT>;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  sceneMapResolution: number;
}) {
  const sceneMapUnitSize = sceneMapResolution;
  const zoom = calcZoom(svgSize, viewBox);

  const [, , width, height] = viewBox;

  const borderCoordinates = getBorderCoordinates(tagsPositions);

  if (!borderCoordinates) {
    return null;
  }

  const { left, right, top, bottom } = borderCoordinates;

  const lines = [];

  for (let row = bottom + sceneMapUnitSize; row < top; row = row + sceneMapUnitSize) {
    const translateY = top - row;
    lines.push(
      <line
        key={`row${row}`}
        stroke="black"
        strokeWidth={row === 0 ? 2 / zoom : 1 / zoom}
        x1="0"
        x2={width}
        y1={translateY}
        y2={translateY}
      />,
    );
  }

  for (let col = left + sceneMapUnitSize; col < right; col = col + sceneMapUnitSize) {
    const translateX = -left + col;

    lines.push(
      <line
        key={`col${col}`}
        stroke="blue"
        strokeWidth={col === 0 ? 2 / zoom : 1 / zoom}
        x1={translateX}
        x2={translateX}
        y1="0"
        y2={height}
      />,
    );
  }

  return (
    <svg {...svgSize} style={coordinateGridCanvasStyle} viewBox={viewBox.join(' ')}>
      <g>{lines}</g>
    </svg>
  );
}

function calcZoom(svgSize: SizeT, viewBox: ViewBoxT) {
  const [, , width] = viewBox;
  return svgSize.width / width;
}

const reactAreasCanvasStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
  zIndex: REACT_AREAS_CANVAS_Z_INDEX,
};

const reactAreaStyle: React.CSSProperties = {
  position: 'relative',
};

function drawReactAreas(
  tagData: ReadonlyArray<PositionedTagRectT>,
  svgSize: SizeT,
  viewBox: ViewBoxT,
  transform: string,
) {
  const zoom = calcZoom(svgSize, viewBox);
  const rects = tagData.map(({ id, color, rectRight, rectTop, rectLeft, rectBottom }) => {
    const x = rectLeft;
    const y = -rectTop;

    const width = rectRight - rectLeft;
    const height = rectTop - rectBottom;

    return (
      <rect
        // fill="purple"
        fillOpacity="0"
        height={height}
        key={id}
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth={3 / zoom}
        style={reactAreaStyle}
        width={width}
        x={x}
        y={y}
      />
    );
  });
  return (
    <svg {...svgSize} style={reactAreasCanvasStyle} viewBox={viewBox.join(' ')}>
      <g transform={transform}>{rects}</g>
    </svg>
  );
}

export default SvgTagsCloud;
