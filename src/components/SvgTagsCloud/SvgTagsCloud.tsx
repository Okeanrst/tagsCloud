import React, { useMemo, useRef, useEffect, useLayoutEffect, useImperativeHandle, RefObject } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import * as actions from 'store/actions/tagsCloud';
import { noop } from 'utilities/noop';
import { getTagsSvgData } from 'utilities/tagsCloud/tagSvgData';
import { exportTagCloudAsHtml } from 'utilities/common/exportTagCloudAsHtml';
import { useObjectRef } from 'utilities/hooks/useObjectRef';
import { RootStateT } from 'store/types';
import { Tags } from './Tags';
import { Vacancies } from './Vacancies';
import { CoordinateGrid } from './CoordinateGrid';
import { ReactAreas } from './ReactAreas';
import { downloadTagCloudHtmlFile, flatVacancies } from './utils';
import { TAG_AVATAR_CANVAS_DEFAULT_Z_INDEX, TAG_AVATAR_CANVAS_Z_INDEX } from './constants';
import { SceneFrameT } from 'types/types';
import { FrameOffsetT } from './utils';
import { useTagDrag, DraggableTagAvatarProps } from './useTagDrag';
import { useTagByTagReveal } from './useTagByTagReveal';
import { useTagsCloudGeometry } from './useTagsCloudGeometry';

type PropsT = {
  width: number;
  height: number;
  onTagClick: (id: string) => void;
  downloadCloudCounter: number;
  isVacanciesShown: boolean;
  isReactAreasShown: boolean;
  isCoordinateGridShown: boolean;
  scale: number;
  sceneFrame: SceneFrameT;
  isTagsCloudInteractionDisabled: boolean;
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
    cursor: 'grabbing',
  },
  canvasWrapper: {
    display: 'inline-block',
    position: 'relative',
    touchAction: 'none',
  },
});

const DraggableTagAvatar = (props: DraggableTagAvatarProps) => {
  const { label = '', color = 'black', fontSize = 8, display = 'none', ref } = props;
  return (
    <text ref={ref} style={{ fill: color, fontSize, display }} textAnchor="middle">
      {label}
    </text>
  );
};

const useCounterChanged = ({ counter, callbackRef }: { counter: number; callbackRef: RefObject<() => void> }) => {
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

type SvgTagsCloudHandle = { oneByOne: () => void };
type SvgTagsCloudProps = PropsT & { ref?: React.Ref<SvgTagsCloudHandle> };

export const SvgTagsCloud = ({
  width,
  height,
  onTagClick,
  downloadCloudCounter,
  isCoordinateGridShown,
  isReactAreasShown,
  isVacanciesShown,
  scale,
  sceneFrame,
  isTagsCloudInteractionDisabled,
  ref,
}: SvgTagsCloudProps) => {
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
  const handleMouseUpEventRef = useRef(noop);
  const svgSizeFactorRef = useRef(1);
  const downloadTagCloudRef = useRef(noop);

  const classes = useStyles({ fontFamily });

  useCounterChanged({ counter: downloadCloudCounter, callbackRef: downloadTagCloudRef });

  const scaleRef = useObjectRef<number>(scale);

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
    return flatVacancies(vacancies);
  }, [vacancies, isVacanciesShown]);

  const tagsCount = tagsSvgData?.data?.length ?? 0;

  const { tagEndIndexToShow, beginTagByTagReveal } = useTagByTagReveal(tagsCount, tagByTagRenderInterval);

  const geometry = useTagsCloudGeometry({
    width,
    height,
    scale,
    sceneFrame,
    tagsSvgData,
    sceneMapPositions,
  });

  useImperativeHandle(
    ref,
    () => ({
      oneByOne: beginTagByTagReveal,
    }),
    [beginTagByTagReveal],
  );

  const { bind, draggableTag, draggableTagAvatarProps, activeVacancies, clearDragState } = useTagDrag({
    isInteractionDisabled: isTagsCloudInteractionDisabled,
    canvasWrapperRef,
    canvasFrameOffsetRef: canvasFrameOffset,
    draggableTagAvatarRef,
    svgSizeFactorRef,
    svgSizeFactor: geometry?.svgSizeFactor ?? 1,
    scaleRef,
    onDragEndRef: handleMouseUpEventRef,
    sceneMapPositions,
    sceneMapEdges: geometry?.sceneMapEdges ?? null,
    sceneMapResolution,
    tagsPositions,
    rectAreasMaps,
    vacancies,
    fontFamily,
    onTagClick,
  });

  useLayoutEffect(() => {
    if (!geometry || !tagsPositions) {
      handleMouseUpEventRef.current = noop;
      downloadTagCloudRef.current = noop;
      return;
    }

    const { svgSize, viewBox, svgSizeFactor, canvasFrameOffset: canvasFrameOffsetValue, renderInputs } = geometry;
    const { positionedTagSvgData, transform } = renderInputs;

    svgSizeFactorRef.current = svgSizeFactor;
    canvasFrameOffset.current = canvasFrameOffsetValue;

    handleMouseUpEventRef.current = () => {
      clearDragState();

      if (!activeVacancies || !activeVacancies.length || !draggableTag) {
        return;
      }

      const { vacancy: targetVacancy, kind: targetVacancyKind } = activeVacancies[0] ?? {};

      if (targetVacancy && targetVacancyKind) {
        const { id: tagId, changeRotation } = draggableTag;
        const currentTagPosition = tagsPositions.find(({ id }) => id === tagId);
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
        viewBox,
        transform,
        fontFamily,
      });
      downloadTagCloudHtmlFile(html);
    };
  }, [dispatch, draggableTag, fontFamily, geometry, tagsPositions, activeVacancies, clearDragState]);

  if (!geometry || !tagsPositions) {
    return null;
  }

  const { svgSize, viewBox, svgSizeFactor, sceneMapEdges, renderInputs } = geometry;
  const { fullSceneViewBox, positionedTagSvgData, transform } = renderInputs;

  return (
    <div className={classes.container}>
      <div
        className={classes.canvasWrapper}
        ref={canvasWrapperRef}
        onClick={bind.onClick}
        onContextMenu={bind.onContextMenu}
        onMouseDown={bind.onMouseDown}
        onTouchStart={bind.onTouchStart}
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
            <DraggableTagAvatar {...draggableTagAvatarProps} />
          </g>
        </svg>
      </div>
    </div>
  );
};
