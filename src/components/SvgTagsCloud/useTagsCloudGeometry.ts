import { useMemo } from 'react';
import { getSuitableSize } from 'utilities/common/getSuitableSize';
import { SceneMap, SceneEdgesT, PositionT } from 'utilities/positioningAlgorithm/sceneMap';
import { getTagsSvgData } from 'utilities/tagsCloud/tagSvgData';
import { PositionedTagSvgDataT, SceneFrameT, SizeT, ViewBoxT } from 'types/types';
import { calcSVGSizeFactor, getSVGViewBox, getCanvasFrameOffset, FrameOffsetT } from './utils';

type TagsCloudGeometryRenderInputsT = {
  aspectRatio: number;
  fullSceneViewBox: ViewBoxT;
  positionedTagSvgData: ReadonlyArray<PositionedTagSvgDataT>;
  transform: string;
};

type TagsCloudGeometryT = {
  svgSize: SizeT;
  viewBox: ViewBoxT;
  svgSizeFactor: number;
  canvasFrameOffset: FrameOffsetT;
  sceneMapEdges: SceneEdgesT | null;
  renderInputs: TagsCloudGeometryRenderInputsT;
};

type ParamsT = {
  width: number;
  height: number;
  scale: number;
  sceneFrame: SceneFrameT;
  tagsSvgData: NonNullable<ReturnType<typeof getTagsSvgData>> | null | undefined;
  sceneMapPositions: readonly PositionT[] | null | undefined;
};

export function useTagsCloudGeometry({
  width,
  height,
  scale,
  sceneFrame,
  tagsSvgData,
  sceneMapPositions,
}: ParamsT): TagsCloudGeometryT | null {
  const sceneMapEdges = useMemo(() => {
    if (!sceneMapPositions) {
      return null;
    }
    // SceneMap expects a mutable array type.
    return new SceneMap([...sceneMapPositions]).getSceneEdges();
  }, [sceneMapPositions]);

  return useMemo(() => {
    if (!tagsSvgData) {
      return null;
    }

    const { viewBox: fullSceneViewBox, transform, aspectRatio, data: positionedTagSvgData } = tagsSvgData;

    const svgSize = getSuitableSize({ availableSize: { width, height }, aspectRatio, scale });
    const viewBox = getSVGViewBox({ fullSceneViewBox, sceneFrame });
    const svgSizeFactor = calcSVGSizeFactor(svgSize, fullSceneViewBox) ?? 1;
    const canvasFrameOffset = getCanvasFrameOffset(fullSceneViewBox, viewBox, svgSizeFactor);

    return {
      svgSize,
      viewBox,
      svgSizeFactor,
      canvasFrameOffset,
      sceneMapEdges,
      renderInputs: {
        aspectRatio,
        fullSceneViewBox,
        positionedTagSvgData,
        transform,
      },
    };
  }, [height, scale, sceneFrame, sceneMapEdges, tagsSvgData, width]);
}
