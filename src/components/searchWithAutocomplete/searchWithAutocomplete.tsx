import React, { useCallback } from 'react';
import deburr from 'lodash.deburr';
import Downshift from 'downshift';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import { Input } from 'ui/Input';
import type { ClassesT } from 'types/types';

type SuggestionT = {
  id: string;
  label: string;
};

type SuggestionsT = ReadonlyArray<SuggestionT>;

type IntegrationDownshiftPropsT = {
  suggestions: SuggestionsT;
  classes: ClassesT;
  placeholder: string;
  onChange?: (target: string | null) => void;
  onSubmit?: (target: string | null) => void;
  disabled?: boolean;
};

type ItemPropsT = {
  InputProps: {};
  classes: ClassesT;
  fullWidth: boolean;
  disabled?: boolean;
};

type RenderSuggestionPropsT = {
  suggestion: SuggestionT;
  index: number;
  itemProps: ItemPropsT;
  highlightedIndex: number | null;
  selectedItem?: string;
};

type HandleKeyDownT = (event: React.KeyboardEvent) => void;

type OptionsT = Pick<IntegrationDownshiftPropsT, 'placeholder' | 'onChange'> & {
  onKeyDown: HandleKeyDownT;
};

const SUGGESTIONS_MAX_NUMBER = 5;

function renderSuggestion({ suggestion, index, itemProps, highlightedIndex, selectedItem }: RenderSuggestionPropsT) {
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  return (
    <MenuItem
      {...itemProps}
      component="div"
      key={suggestion.label}
      selected={isHighlighted}
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {suggestion.label}
    </MenuItem>
  );
}

function getSuitableSuggestions(value: string | null, suggestions: SuggestionsT) {
  if (!value) {
    return [];
  }

  const inputValue = deburr(value.trim()).toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : suggestions.filter((suggestion) => {
        const keep =
          count < SUGGESTIONS_MAX_NUMBER && suggestion.label.slice(0, inputLength).toLowerCase() === inputValue;

        if (keep) {
          count += 1;
        }

        return keep;
      });
}

const handleKeyDown: HandleKeyDownT = () => {};

export function SearchWithAutocomplete(props: IntegrationDownshiftPropsT) {
  const { classes, suggestions, placeholder, onChange, onSubmit, disabled } = props;

  const onSelect = useCallback(
    (selectedItem) => {
      if (selectedItem && onSubmit) {
        onSubmit(selectedItem);
      }
    },
    [onSubmit],
  );

  return (
    <div className={classes.root}>
      <Downshift onChange={onSelect}>
        {({ getInputProps, getItemProps, getMenuProps, highlightedIndex, inputValue, isOpen, selectedItem }) => {
          const {
            ref: inputRef,
            disabled: inputDisabled,
            ...inputProps
          } = getInputProps<OptionsT>({
            placeholder,
            onChange,
            onKeyDown: handleKeyDown,
          });

          return (
            <div className={classes.container}>
              <Input
                {...inputProps}
                disabled={disabled || inputDisabled}
                // @ts-ignore
                ref={inputRef}
              />
              <div {...getMenuProps()}>
                {isOpen ? (
                  <Paper square className={classes.paper}>
                    {getSuitableSuggestions(inputValue, suggestions).map((suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion.label }),
                        highlightedIndex,
                        selectedItem,
                      }),
                    )}
                  </Paper>
                ) : null}
              </div>
            </div>
          );
        }}
      </Downshift>
    </div>
  );
}
