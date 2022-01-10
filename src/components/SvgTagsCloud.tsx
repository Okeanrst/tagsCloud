import React, { useCallback, useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { withStyles, createStyles } from '@material-ui/core';
import { Transition, TransitionGroup } from 'react-transition-group';
import throttle from 'lodash.throttle';
import * as actions from 'store/actions/tagsCloud';
import { getBorderCoordinates, getTagsSvgData } from 'utilities/tagsCloud/tagsCloud';
import { getSuitableSize } from 'utilities/tagsCloud/getSuitableSize';
import { isVacancyLargeEnoughToFitRect, rotateRectArea } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { SceneMap, Dimensions } from 'utilities/positioningAlgorithm/sceneMap';
import { formRectAreaMapKey } from 'utilities/prepareRectAreasMaps';
import { getRectAreaOfRectMap } from 'utilities/getGlyphsMap';
import { VacanciesManager } from 'utilities/positioningAlgorithm/vacanciesManager';
import { FONT_FAMILY, SCENE_MAP_RESOLUTION } from 'constants/index';
import { Checkbox } from 'ui/checkbox/Checkbox';
import { Collapse } from 'components/Collapse';

import type { PositionedTagRectT, ClassesT, RectAreaT } from 'types/types';
import type { SizeT } from 'utilities/tagsCloud/getSuitableSize';
import type { ViewBoxT } from 'utilities/tagsCloud/tagsCloud';
import { RootStateT } from 'store/types';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { SceneEdgesT } from 'utilities/positioningAlgorithm/sceneMap';

type PropsT = {
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  classes: ClassesT;
};

type CoordinatesT = { x: number; y: number };

type VacanciesT = NonNullable<RootStateT['tagsCloud']['vacancies']>;

const DURATION = 500;

const MOVEMENT_THRESHOLD = 10; // px

const DEFAULT_STYLE = {
  transition: `all ${DURATION}ms ease-in-out`,
  opacity: 0,
};

const styles = createStyles({
  container: {
    width: '100%',
    textAlign: 'center',
  },
  text: {
    'white-space': 'pre',
    'user-select': 'none',
  },
  settingsControlsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  toggleIsSettingsControlsButton: {
    position: 'absolute',
    top: 0,
    right: '-20px',
    width: '20px',
    height: '16px',
    lineHeight: '16px',
    border: 'none',
  },
  settingsControls: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#d2d2d2',
  },
  canvasWrapper: {
    display: 'inline-block',
    position: 'relative',
  }
});

const AVATAR_WIDTH = 50;
const AVATAR_HEIGHT = 50;

const draggableTagAvatarStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'none',
  width: `${AVATAR_WIDTH}px`,
  height: `${AVATAR_HEIGHT}px`,
  border: '1px solid green',
  zIndex: 10,
};

const DraggableTagAvatar = React.forwardRef<HTMLDivElement, {}>((props, ref ) => {
  return (
    <div
      className="DraggableTagAvatar"
      ref={ref}
      style={draggableTagAvatarStyle}
    />
  );
});

const activeVacanciesStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
};

const renderVacancyRect = (vacancy: VacancyT, kind: string, importanceIndex: number) => {
  // @ts-ignore
  const left = Number.isFinite(vacancy.left) ? vacancy.left : vacancy.leftEdgeColumn;
  // @ts-ignore
  const right = Number.isFinite(vacancy.right) ? vacancy.right : vacancy.rightEdgeColumn;
  // @ts-ignore
  const top = Number.isFinite(vacancy.top) ? vacancy.top : vacancy.topEdgeRow;
  // @ts-ignore
  const bottom = Number.isFinite(vacancy.bottom) ? vacancy.bottom : vacancy.bottomEdgeRow;

  if (left > right || top < bottom) {
    // the case when vacancy is outside the scene
    return null;
  }

  return (
    <rect
      fill="purple"
      fillOpacity="0"
      height={SceneMap.countPositions(bottom, top) * SCENE_MAP_RESOLUTION}
      key={`${left},${right},${top},${bottom},${kind}`}
      stroke="blue"
      strokeOpacity="0.25"
      strokeWidth={importanceIndex === 0 ? 1 : 0.5}
      width={SceneMap.countPositions(left, right) * SCENE_MAP_RESOLUTION}
      x={SceneMap.getPositionLeftEdge(left) * SCENE_MAP_RESOLUTION}
      y={-SceneMap.getPositionRightEdge(top) * SCENE_MAP_RESOLUTION}
    />
  );
};

type ActiveVacanciesPropsT = {
  vacancies: { vacancy: VacancyT; kind: VacancyKinds }[] | null;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  transform: string;
};
const ActiveVacancies = ({ vacancies, svgSize, viewBox, transform }: ActiveVacanciesPropsT) => {
  const rects: React.ReactNode[] = [];
  if (vacancies) {
    vacancies.forEach(({ vacancy, kind }) => {
      rects.push(renderVacancyRect(vacancy, kind, rects.length));
    });
  }

  return (
    <svg
      id="activeVacancies"
      {...svgSize}
      style={activeVacanciesStyle}
      viewBox={viewBox.join(' ')}
    >
      <g transform={transform}>
        {rects}
      </g>
    </svg>
  );
};

const getActiveVacanciesByCoordinates = (point: CoordinatesT, rectArea: RectAreaT, vacancies: VacanciesT): VacanciesT => {
  const { closedVacancies, topEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies, rightEdgeVacancies } = vacancies;

  function processVacancies<T extends VacancyT>(vacanciesToProcess: T[]) {
    const suitableVacancies: T[] = [];
    vacanciesToProcess.forEach(vacancy => {
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
  const sortedVacancies: {vacancy: VacancyT, kind: VacancyKinds}[] = [];
  for (let kind of Object.values(VacancyKinds)) {
    sortedVacancies.push(...(vacancies[kind].map(vacancy => ({ vacancy, kind }))));
  }
  return sortedVacancies;
};

const documentCoordinatesToCanvasCoordinates = (documentCoordinates: CoordinatesT, canvasRect: DOMRect): CoordinatesT => {
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

const canvasCoordinatesToSceneCoordinates = (canvasCoordinates: CoordinatesT, sceneEdges: SceneEdgesT, zoom: number) => {
  const { x, y } = canvasCoordinates;

  return {
    x: (x / zoom + sceneEdges[Dimensions.MINUS_X] * SCENE_MAP_RESOLUTION) / SCENE_MAP_RESOLUTION,
    y: (sceneEdges[Dimensions.Y] * SCENE_MAP_RESOLUTION - y / zoom) / SCENE_MAP_RESOLUTION,
  };
};

const stateSelector = (state: RootStateT) => {
  const { tagsCloud: { tagsPositions, vacancies, sceneMap: sceneMapPositions }, rectAreasMapsData: rectAreasMaps } = state;
  return { tagsPositions, vacancies, rectAreasMaps, sceneMapPositions  };
};

const SvgTagsCloud = ({
  width,
  height,
  onTagClick,
  classes,
}: PropsT) => {
  const { tagsPositions, vacancies, rectAreasMaps, sceneMapPositions } = useSelector(stateSelector);
  const dispatch = useDispatch();

  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const draggableTagAvatarRef = useRef<HTMLDivElement | null>(null);
  const preventOnClickHandlingRef = useRef<boolean>(false);
  const handleMouseUpEventRef = useRef(() => {});

  const [isCoordinateGridShown, setIsCoordinateGridShown] = useState(false);
  const [isReactAreasShown, setIsReactAreasShown] = useState(false);
  const [isSettingsControlsShown, setIsSettingsControlsShown] = useState(false);
  const [draggableTagId, setDraggableTagId] = useState<string | null>(null);
  const [draggableTagPosition, setDraggableTagPosition] = useState<{ x: number; y: number } | null>(null);

  const toggleIsCoordinateGridShown = useCallback(() => {
    setIsCoordinateGridShown((value) => !value);
  }, [setIsCoordinateGridShown]);

  const toggleIsReactAreasShown = useCallback(() => {
    setIsReactAreasShown((value) => !value);
  }, [setIsReactAreasShown]);

  const toggleIsSettingsControlsShown = useCallback(() => {
    setIsSettingsControlsShown((value) => !value);
  }, [setIsSettingsControlsShown]);

  const sceneMapEdges = useMemo(() => {
    if (!sceneMapPositions) {
      return null;
    }
    return new SceneMap(sceneMapPositions).getSceneEdges();
  }, [sceneMapPositions]);

  const tagsSvgData = useMemo(() => {
    return tagsPositions && getTagsSvgData(tagsPositions);
  }, [tagsPositions]);

  const onCanvasWrapperClick = useCallback((e: React.SyntheticEvent<EventTarget>) => {
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
  }, [onTagClick]);

  const onCanvasWrapperMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target instanceof SVGTextElement)) {
      return;
    }
    const tagId = e.target.dataset.id;
    if (!draggableTagAvatarRef.current || !tagId) {
      return;
    }

    const { pageX: initPageX, pageY: initPageY } = e;

    let didDraggingStart = false;

    const throttledSetDraggableTagPosition = throttle(setDraggableTagPosition, 100);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!didDraggingStart) {
        didDraggingStart = ((initPageX - moveEvent.pageX) ** 2 + (initPageY - moveEvent.pageY) ** 2) ** 0.5 > MOVEMENT_THRESHOLD;
        didDraggingStart && setDraggableTagId(tagId);
      }

      if (!didDraggingStart) {
        return;
      }

      preventOnClickHandlingRef.current = true;

      if (!draggableTagAvatarRef.current || !draggableTagAvatarRef.current.style) {
        return;
      }

      const canvasWrapperRect = canvasWrapperRef.current?.getBoundingClientRect();
      if (!canvasWrapperRect) {
        return;
      }

      const canvasCoordinates = documentCoordinatesToCanvasCoordinates({
        x: moveEvent.pageX,
        y: moveEvent.pageY
      }, canvasWrapperRect);

      const { x: avatarX, y: avatarY } = limitCoordinatesWithCanvasBoundaries(canvasCoordinates, canvasWrapperRect);

      draggableTagAvatarRef.current.style.left = (avatarX - AVATAR_WIDTH / 2) + 'px';
      draggableTagAvatarRef.current.style.top = avatarY - AVATAR_HEIGHT / 2 + 'px';
      draggableTagAvatarRef.current.style.display = 'block';

      throttledSetDraggableTagPosition({ x: avatarX, y: avatarY });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

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
  }, []);

  if (!tagsPositions || !tagsSvgData) {
    return null;
  }

  const {
    viewBox,
    transform,
    aspectRatio,
    data: positionedTagSvgData,
  } = tagsSvgData;

  const svgSize = getSuitableSize({ width, height }, aspectRatio);

  const activeVacancies = (() => {
    if (!draggableTagPosition || !draggableTagId || !vacancies || !sceneMapEdges) {
      return null;
    }
    const tagPosition = tagsPositions?.find(({ id }) => id === draggableTagId);
    if (!tagPosition) {
      return null;
    }

    const rectAreaMapKey = formRectAreaMapKey(tagPosition.label, tagPosition.fontSize);

    const { map: rectAreaMap } = rectAreasMaps.find(({ key }) => key === rectAreaMapKey) ?? {};

    if (!rectAreaMap) {
      return null;
    }

    const tagRectArea = tagPosition.rotate ?
      rotateRectArea(getRectAreaOfRectMap(rectAreaMap))
      : getRectAreaOfRectMap(rectAreaMap);

    if (!tagRectArea) {
      return null;
    }

    const zoom = calcZoom(svgSize, viewBox);

    const scenePointCoordinates = canvasCoordinatesToSceneCoordinates(draggableTagPosition, sceneMapEdges, zoom);

    return sortActiveVacancies(getActiveVacanciesByCoordinates(scenePointCoordinates, tagRectArea, vacancies));
  })();

  handleMouseUpEventRef.current = () => {
    preventOnClickHandlingRef.current = false;
    setDraggableTagPosition(null);
    setDraggableTagId(null);

    if (!activeVacancies || !activeVacancies.length || !draggableTagId) {
      return;
    }

    const { vacancy: targetVacancy, kind: targetVacancyKind } = activeVacancies[0] ?? {};

    if (targetVacancy && targetVacancyKind) {
      dispatch(actions.changeTagPosition({
        tagId: draggableTagId,
        vacancy: targetVacancy,
        vacancyKind: targetVacancyKind
      }));
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.settingsControlsWrapper}>
        <button
          className={classes.toggleIsSettingsControlsButton}
          onClick={toggleIsSettingsControlsShown}
        >
          {isSettingsControlsShown ? '-' : '+'}
        </button>
        <Collapse isOpen={isSettingsControlsShown} >
          <div className={classes.settingsControls}>
            <Checkbox
              checked={isCoordinateGridShown}
              label="draw coordinate grid"
              onChange={toggleIsCoordinateGridShown}
            />
            <Checkbox
              checked={isReactAreasShown}
              label="draw react areas"
              onChange={toggleIsReactAreasShown}
            />
          </div>
        </Collapse>
      </div>
      <div
        className={classes.canvasWrapper}
        ref={canvasWrapperRef}
        onClick={onCanvasWrapperClick}
        onMouseDown={onCanvasWrapperMouseDown}
      >
        {isCoordinateGridShown && drawCoordinateGrid(tagsPositions, svgSize, viewBox)}
        {isReactAreasShown && drawReactAreas(tagsPositions, svgSize, viewBox, transform)}
        <DraggableTagAvatar ref={draggableTagAvatarRef} />
        <svg
          id="small_cloud"
          {...svgSize}
          style={{ position: 'relative', zIndex: 2 }}
          viewBox={viewBox.join(' ')}
        >
          <g transform={transform}>
            <TransitionGroup
              appear
              enter
              className="tagsCloud"
              component={null}
              exite={false}
            >
              {positionedTagSvgData.map((i, index: number) => {
                const style = {
                  fontSize: `${i.adaptFontSize}px`,
                  fontFamily: FONT_FAMILY,
                  fill: i.color,
                };
                const transitionStyles: { [key: string]: React.CSSProperties } = {
                  exited: {
                    opacity: 0,
                    transform: `translate(${i.rectTranslateX}px,${
                      i.rectTranslateY
                    }px) rotate(${i.rotate ? 90 : 0}deg) scale(1)`,
                  },
                  entering: {
                    opacity: 0,
                    transform: `translate(${i.rectTranslateX}px,${
                      i.rectTranslateY
                    }px) rotate(${i.rotate ? 90 : 0}deg) scale(0.1)`,
                  },
                  entered: {
                    opacity: 1,
                    transform: `translate(${i.rectTranslateX}px,${
                      i.rectTranslateY
                    }px) rotate(${i.rotate ? 90 : 0}deg) scale(1)`,
                  },
                };

                return (
                  <Transition
                    key={i.id}
                    timeout={DURATION}
                    // classNames="tagText"
                  >
                    {state => {
                      return (
                        <text
                          className={classes.text}
                          data-id={i.id}
                          // transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                          key={`${i.id}_${index}`}
                          style={{
                            ...style,
                            ...DEFAULT_STYLE,
                            ...transitionStyles[state],
                          }}
                          textAnchor="middle"
                        >
                          {i.label}
                        </text>
                      );
                    }}
                  </Transition>
                );
              })}
            </TransitionGroup>
          </g>
        </svg>
        <ActiveVacancies
          svgSize={svgSize}
          transform={transform}
          vacancies={activeVacancies}
          viewBox={viewBox}
        />
      </div>
    </div>
  );
};

const coordinateGridStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
};

function drawCoordinateGrid(tagData: ReadonlyArray<PositionedTagRectT>, svgSize: SizeT, viewBox: ViewBoxT) {
  const sceneMapUnitSize = SCENE_MAP_RESOLUTION;
  const zoom = calcZoom(svgSize, viewBox);

  const [,, width, height] = viewBox;

  const borderCoordinates = getBorderCoordinates(tagData);

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
      />
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
      />
    );
  }

  return (
    <svg
      id="coordinateGrid"
      {...svgSize}
      style={coordinateGridStyle}
      viewBox={viewBox.join(' ')}
    >
      <g>
        {lines}
      </g>
    </svg>
  );
}

function calcZoom(svgSize: SizeT, viewBox: ViewBoxT) {
  const [,, width] = viewBox;
  return svgSize.width / width;
}

function drawReactAreas(tagData: ReadonlyArray<PositionedTagRectT>, svgSize: SizeT, viewBox: ViewBoxT, transform: string) {
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
        style={{ position: 'relative', zIndex: 1 }}
        width={width}
        x={x}
        y={y}
      />
    );
  });
  return (
    <svg
      id="reactAreas"
      {...svgSize}
      style={coordinateGridStyle}
      viewBox={viewBox.join(' ')}
    >
      <g transform={transform} >
        {rects}
      </g>
    </svg>
  );
}

export default withStyles(styles)(SvgTagsCloud);
