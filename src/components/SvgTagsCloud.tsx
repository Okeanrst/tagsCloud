import { useCallback, useState, useMemo } from 'react';
import { withStyles, createStyles } from '@material-ui/core';
import { Transition, TransitionGroup } from 'react-transition-group';
import { getTagsSvgData } from 'utilities/tagsCloud/tagsCloud';
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

const PADDING = 16;

const DURATION = 500;

const DEFAULT_STYLE = {
  transition: `all ${DURATION}ms ease-in-out`,
  opacity: 0,
};

const styles = createStyles({
  container: {
    position: 'relative',
    padding: `${PADDING}px`,
  },
  text: {
    'white-space': 'pre',
  },
  settingsControlsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    right: `${PADDING}px`,
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
    backgroundColor: '#d2d2d2',
  },
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
  const [isAxlesShown, setIsAxlesShown] = useState(false);
  const [isSettingsControlsShown, setIsSettingsControlsShown] = useState(false);

  const toggleIsCoordinateGridShown = useCallback(() => {
    setIsCoordinateGridShown((value) => !value);
  }, [setIsCoordinateGridShown]);

  const toggleIsReactAreasShown = useCallback(() => {
    setIsReactAreasShown((value) => !value);
  }, [setIsReactAreasShown]);

  const toggleIsAxlesShown = useCallback(() => {
    setIsAxlesShown((value) => !value);
  }, [setIsAxlesShown]);

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

  const availableWidth = width - PADDING * 2;
  const availableHeight = height - PADDING * 2;

  const svgSize = getSuitableSize(
    { width: availableWidth, height: availableHeight },
    aspectRatio,
  );

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
            <Checkbox
              checked={isAxlesShown}
              label="draw axles"
              onChange={toggleIsAxlesShown}
            />
          </div>
        </Collapse>
      </div>
      {isCoordinateGridShown && drawCoordinateGrid(svgSize, viewBox)}
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
          {isAxlesShown && drawAxles(svgSize)}
        </g>
      </svg>
    </div>
  );
};

const coordinateGridStyle: React.CSSProperties = {
  position: 'absolute',
  top: `${PADDING}px`,
  left: `${PADDING}px`,
  outline: '1px solid',
};

function drawCoordinateGrid(svgSize: SizeT, viewBox: ViewBoxT) {
  const sceneMapUnitSize = SCENE_MAP_RESOLUTION;

  const [,, width, height] = viewBox;

  const columns = width / sceneMapUnitSize;
  const rows = (height ?? 0) / sceneMapUnitSize;

  const lines = [];

  for (let row = 0; row < rows; row++) {
    const translateY = row * sceneMapUnitSize;
    lines.push(
      <line
        key={`row${row}`}
        stroke="black"
        x1="0"
        x2={width}
        y1={translateY}
        y2={translateY}
      />
    );
  }

  for (let col = 0; col < columns; col++) {
    const translateX = col * sceneMapUnitSize;

    lines.push(
      <line
        key={`col${col}`}
        stroke="blue"
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

function drawAxles({ width, height }: SizeT) {
  const fontSize = 2;
  const style = {
    fontSize: `${fontSize}px`,
    fontFamily: FONT_FAMILY,
    fill: 'rgb(0, 0, 0)',
  };

  return [
    <text
      key={`x`}
      style={style}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${0})`}
    >
      {Array.from({ length: Math.floor(width / fontSize) })
        .fill('–')
        .join('')}
    </text>,
    <text
      key={`y`}
      style={style}
      textAnchor="middle"
      transform={`translate(${0},${0})rotate(${90})`}
    >
      {Array.from({ length: Math.floor(height / fontSize) })
        .fill('–')
        .join('')}
    </text>,
  ];
}

export default withStyles(styles)(SvgTagsCloud);
