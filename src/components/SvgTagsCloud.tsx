import { useCallback, useState, useMemo } from 'react';
import { withStyles, createStyles } from '@material-ui/core';
import { Transition, TransitionGroup } from 'react-transition-group';
import { getBorderCoordinates, getTagsSvgData } from 'utilities/tagsCloud/tagsCloud';
import { getSuitableSize } from 'utilities/tagsCloud/getSuitableSize';
import { FONT_FAMILY, SCENE_MAP_RESOLUTION } from 'constants/index';
import { Checkbox } from 'ui/checkbox/Checkbox';
import { Collapse } from 'components/Collapse';

import React from 'react';
import type { PositionedTagRectT, ClassesT } from 'types/types';
import type { SizeT } from 'utilities/tagsCloud/getSuitableSize';
import type { ViewBoxT } from 'utilities/tagsCloud/tagsCloud';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  classes: ClassesT;
};

const DURATION = 500;

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

const SvgTagsCloud = ({
  tagData,
  width,
  height,
  onTagClick,
  classes,
}: PropsT) => {
  const [isCoordinateGridShown, setIsCoordinateGridShown] = useState(false);
  const [isReactAreasShown, setIsReactAreasShown] = useState(false);
  const [isSettingsControlsShown, setIsSettingsControlsShown] = useState(false);

  const toggleIsCoordinateGridShown = useCallback(() => {
    setIsCoordinateGridShown((value) => !value);
  }, [setIsCoordinateGridShown]);

  const toggleIsReactAreasShown = useCallback(() => {
    setIsReactAreasShown((value) => !value);
  }, [setIsReactAreasShown]);

  const toggleIsSettingsControlsShown = useCallback(() => {
    setIsSettingsControlsShown((value) => !value);
  }, [setIsSettingsControlsShown]);

  const tagsSvgData = useMemo(() => getTagsSvgData(tagData), [tagData]);

  if (!tagsSvgData) {
    return null;
  }

  const {
    viewBox,
    transform,
    aspectRatio,
    data: positionedTagSvgData,
  } = tagsSvgData;

  const svgSize = getSuitableSize({ width, height }, aspectRatio);

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
      <div className={classes.canvasWrapper}>
        {isCoordinateGridShown && drawCoordinateGrid(tagData, svgSize, viewBox)}
        {isReactAreasShown && drawReactAreas(tagData, svgSize, viewBox, transform)}
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
                          key={`${i.id}_${index}`}
                          style={{
                            ...style,
                            ...DEFAULT_STYLE,
                            ...transitionStyles[state],
                          }}
                          // transform={`translate(${i.rectTranslateX},${i.rectTranslateY})rotate(${i.rotate ? 90 : 0})`}
                          textAnchor="middle"
                          onClick={() => onTagClick(i.id)}
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
        {rects.slice(0)}
      </g>
    </svg>
  );
}

export default withStyles(styles)(SvgTagsCloud);
