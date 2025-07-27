import React from 'react';
import FullScreenModalWindow from './FullScreenModalWindow';
import TagForm, { TagFormPropsT } from 'components/TagForm';

type PropsT = {
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
  formProps: TagFormPropsT;
};

export const TagFormModal = ({ onBackdropClick, formProps }: PropsT) => (
  <FullScreenModalWindow onBackdropClick={onBackdropClick}>
    <TagForm {...formProps} />
  </FullScreenModalWindow>
);
