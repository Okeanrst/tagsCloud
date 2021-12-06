import React from 'react';
import deburr from 'lodash.deburr';
import Downshift from 'downshift';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';

type SuggestionT = {
  id: string;
  label: string;
};

type SuggestionsT = ReadonlyArray<SuggestionT>;

type ClassesT = { [key: string]: string };

type IntegrationDownshiftPropsT = {
  suggestions: SuggestionsT;
  classes: ClassesT;
  placeholder: string;
  onChange?: (target: string | null) => void;
  onSubmit?: (target: string | null) => void;
};

type ItemPropsT = {
  InputProps: {
    ref?: React.LegacyRef<HTMLInputElement>;
  };
  classes: ClassesT;
  fullWidth: boolean;
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

function renderInput(inputProps: ItemPropsT) {
  const {
    InputProps: { ref, ...restInputProps },
    classes,
    fullWidth,
  } = inputProps;

  console.log('renderInput ref:', ref);

  return (
    <TextField
      InputProps={{
        // TODO
        //inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
        },
        ...restInputProps,
      }}
      fullWidth={fullWidth}
    />
  );
}

function renderSuggestion({
  suggestion,
  index,
  itemProps,
  highlightedIndex,
  selectedItem,
}: RenderSuggestionPropsT) {
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  return (
    <MenuItem
      {...itemProps}
      key={suggestion.label}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      {suggestion.label}
    </MenuItem>
  );
}

function getSuggestions(value: string | null, suggestions: SuggestionsT) {
  if (!value) {
    return [];
  }

  const inputValue = deburr(value.trim()).toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : suggestions.filter(suggestion => {
        const keep =
          count < SUGGESTIONS_MAX_NUMBER &&
          suggestion.label.slice(0, inputLength).toLowerCase() === inputValue;

        if (keep) {
          count += 1;
        }

        return keep;
      });
}

export function SearchWithAutocomplete(props: IntegrationDownshiftPropsT) {
  const { classes, suggestions, placeholder, onChange, onSubmit } = props;

  return (
    <div className={classes.root}>
      <Downshift id="downshift-simple">
        {({
          getInputProps,
          getItemProps,
          getMenuProps,
          highlightedIndex,
          inputValue,
          isOpen,
          selectedItem,
        }) => {
          const handleKeyDown: HandleKeyDownT = event => {
            if (
              onSubmit &&
              event.key === 'Enter' &&
              inputValue &&
              highlightedIndex === null
            ) {
              onSubmit(inputValue);
            }
          };

          return (
            <div className={classes.container}>
              {renderInput({
                fullWidth: true,
                classes,
                InputProps: getInputProps<OptionsT>({
                  placeholder,
                  onChange,
                  onKeyDown: handleKeyDown,
                }),
              })}
              <div {...getMenuProps()}>
                {isOpen ? (
                  <Paper className={classes.paper} square>
                    {getSuggestions(inputValue, suggestions).map(
                      (suggestion, index) =>
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
