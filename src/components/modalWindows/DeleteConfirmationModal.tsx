import React from 'react';
import { makeStyles } from '@material-ui/core';
import FullScreenModalWindow from './FullScreenModalWindow';
import { TextButton } from 'ui/buttons/TextButton';
import { PrimaryButton } from 'ui/buttons/PrimaryButton';

type PropsT = {
  onBackdropClick?: (e: React.SyntheticEvent<EventTarget>) => void;
  confirmQuestion: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const useStyles = makeStyles({
  buttons: {
    marginTop: '100px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  confirmDeleteButton: {
    marginLeft: '24px',
  },
});

export const DeleteConfirmationModal = ({ onBackdropClick, confirmQuestion, onConfirm, onCancel }: PropsT) => {
  const classes = useStyles();
  return (
    <FullScreenModalWindow onBackdropClick={onBackdropClick}>
      <span>{confirmQuestion}</span>
      <div className={classes.buttons}>
        <TextButton onClick={onCancel}>Cancel</TextButton>
        <PrimaryButton classes={{ root: classes.confirmDeleteButton }} onClick={onConfirm}>
          Delete
        </PrimaryButton>
      </div>
    </FullScreenModalWindow>
  );
};
