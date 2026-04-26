import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import { makeStyles } from '@material-ui/core';
import { FontFamilies } from 'constants/index';
import { PositionedTagSvgDataT, SizeT, ViewBoxT } from 'types/types';
import { TAGS_CLOUD_CANVAS_Z_INDEX } from './constants';
import { DraggableTagT } from './types';
import { TagTextTransition } from './TagTextTransition';

type PropsT = {
  fontFamily: FontFamilies;
  viewBox: ViewBoxT;
  transform: string;
  svgSize: SizeT;
  tagEndIndexToShow: number;
  positionedTagSvgData: ReadonlyArray<PositionedTagSvgDataT>;
  draggableTag: DraggableTagT | null;
  isTagDraggingDisabled: boolean;
};

const useStyles = makeStyles({
  root: {
    position: 'relative',
    zIndex: TAGS_CLOUD_CANVAS_Z_INDEX,
  },
  text: {
    'white-space': 'pre',
    'user-select': 'none',
    '-webkit-user-select': 'none',
  },
});

export const Tags = ({
  fontFamily,
  viewBox,
  transform,
  svgSize,
  tagEndIndexToShow,
  positionedTagSvgData,
  draggableTag,
  isTagDraggingDisabled,
}: PropsT) => {
  const classes = useStyles();

  const displayedTags =
    tagEndIndexToShow === -1 ? positionedTagSvgData : positionedTagSvgData.slice(0, tagEndIndexToShow);

  return (
    <svg {...svgSize} className={classes.root} style={{ fontFamily }} viewBox={viewBox.join(' ')}>
      <g transform={transform}>
        <TransitionGroup appear enter className="tagsCloud" component={null} exite={false}>
          {displayedTags.map((tag) => (
            <TagTextTransition
              className={classes.text}
              isHidden={Boolean(draggableTag && draggableTag.id === tag.id)}
              isTagDraggingDisabled={isTagDraggingDisabled}
              key={tag.id}
              tag={tag}
            />
          ))}
        </TransitionGroup>
      </g>
    </svg>
  );
};
