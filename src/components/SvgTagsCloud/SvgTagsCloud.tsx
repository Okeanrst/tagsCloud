import React from 'react';
import { useSelector } from 'react-redux';
import { QueryStatuses } from 'constants/queryStatuses';
import type { RootStateT } from 'store/types';
import type { SceneFrameT } from 'types/types';
import { SvgTagsCloudBuilt, SvgTagsCloudHandle } from './SvgTagsCloudBuilt';

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
  const tagsCloud = useSelector((state: RootStateT) => state.tagsCloud);
  const rectAreasMaps = useSelector((state: RootStateT) => state.rectAreasMapsData);
  const { fontFamily, sceneMapResolution, tagByTagRenderInterval } = useSelector((state: RootStateT) => state.settings);

  if (tagsCloud.status !== QueryStatuses.SUCCESS) {
    return null;
  }

  return (
    <SvgTagsCloudBuilt
      downloadCloudCounter={downloadCloudCounter}
      fontFamily={fontFamily}
      height={height}
      isCoordinateGridShown={isCoordinateGridShown}
      isReactAreasShown={isReactAreasShown}
      isTagsCloudInteractionDisabled={isTagsCloudInteractionDisabled}
      isVacanciesShown={isVacanciesShown}
      outerRef={ref}
      rectAreasMaps={rectAreasMaps}
      scale={scale}
      sceneFrame={sceneFrame}
      sceneMapPositions={tagsCloud.sceneMap}
      sceneMapResolution={sceneMapResolution}
      tagByTagRenderInterval={tagByTagRenderInterval}
      tagsPositions={tagsCloud.tagsPositions}
      vacancies={tagsCloud.vacancies}
      width={width}
      onTagClick={onTagClick}
    />
  );
};
