import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import throttle from 'lodash.throttle';
import { makeStyles } from '@material-ui/core';
import { updateSettings } from 'store/actions/settings';
import {
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MAX_SCENE_MAP_RESOLUTION,
  MIN_SCENE_MAP_RESOLUTION,
  MIN_TAG_BY_TAG_RENDER_INTERVAL,
  MAX_TAG_BY_TAG_RENDER_INTERVAL,
  FontFamilies,
  PickingStrategies,
  SortingClosedVacanciesStrategies,
  SortingEdgeVacanciesStrategies,
} from 'constants/index';
import { RootStateT } from 'store/types';
import { InputFormField } from 'ui/InputFormField';
import { CheckboxFormField } from 'ui/CheckboxFormField';
import { SelectFormField } from 'ui/SelectFormField';

type SettingsKeysT = keyof RootStateT['settings'];

const useStyles = makeStyles({
  form: {
    maxWidth: '400px',
  },
  notFirstFormControl: {
    marginTop: '8px',
  },
  helperText: {
    minHeight: '23px',
    marginTop: '2px',
    fontSize: '14px',
    color: 'var(--danger-color)',
  },
});

const fontFamilyOptions: { value: FontFamilies; label: string }[] = [];
for (let fontFamily of Object.values(FontFamilies)) {
  fontFamilyOptions.push({ value: fontFamily, label: fontFamily });
}

const pickingStrategiesOptions: { value: PickingStrategies; label: string }[] = [];
for (let pickingStrategy of Object.values(PickingStrategies)) {
  pickingStrategiesOptions.push({ value: pickingStrategy, label: pickingStrategy });
}

const sortingClosedVacanciesOptions: { value: SortingClosedVacanciesStrategies; label: string }[] = [];
for (let sortingStrategy of Object.values(SortingClosedVacanciesStrategies)) {
  sortingClosedVacanciesOptions.push({ value: sortingStrategy, label: sortingStrategy });
}

const sortingEdgeVacanciesOptions: { value: SortingEdgeVacanciesStrategies; label: string }[] = [];
for (let sortingStrategy of Object.values(SortingEdgeVacanciesStrategies)) {
  sortingEdgeVacanciesOptions.push({ value: sortingStrategy, label: sortingStrategy });
}

const transformInputValue = (inputName: SettingsKeysT, inputValue: any) => {
  const numberInputNames: SettingsKeysT[] = ['maxFontSize', 'minFontSize', 'addIfEmptyIndex', 'sceneMapResolution'];
  if (numberInputNames.includes(inputName)) {
    return Number(inputValue);
  }
  return inputValue;
};

const validate = (values: RootStateT['settings']): Partial<{ [key in SettingsKeysT]: string }> | null => {
  const {
    fontFamily,
    pickingClosedVacancyStrategy,
    pickingEdgeVacancyStrategy,
    sortingClosedVacanciesStrategy,
    sortingEdgeVacanciesStrategy,
    sceneMapResolution,
    minFontSize,
    maxFontSize,
    tagByTagRenderInterval,
  } = values;
  if (!fontFamily) {
    return { fontFamily: 'required' };
  }
  if (!pickingClosedVacancyStrategy) {
    return { pickingClosedVacancyStrategy: 'required' };
  }
  if (!pickingEdgeVacancyStrategy) {
    return { pickingEdgeVacancyStrategy: 'required' };
  }
  if (!sortingClosedVacanciesStrategy) {
    return { sortingClosedVacanciesStrategy: 'required' };
  }
  if (!sortingEdgeVacanciesStrategy) {
    return { pickingEdgeVacancyStrategy: 'required' };
  }

  if (MIN_SCENE_MAP_RESOLUTION > sceneMapResolution) {
    return { sceneMapResolution: `less then ${MIN_SCENE_MAP_RESOLUTION}` };
  }
  if (MAX_SCENE_MAP_RESOLUTION < sceneMapResolution) {
    return { sceneMapResolution: `more then ${MAX_SCENE_MAP_RESOLUTION}` };
  }
  if (minFontSize < sceneMapResolution) {
    return { sceneMapResolution: `more then minFontSize` };
  }

  if (MIN_FONT_SIZE > minFontSize) {
    return { minFontSize: `less then ${MIN_FONT_SIZE}` };
  }
  if (MAX_FONT_SIZE < minFontSize) {
    return { minFontSize: `more then ${MAX_FONT_SIZE}` };
  }
  if (MIN_FONT_SIZE > maxFontSize) {
    return { maxFontSize: `less then ${MIN_FONT_SIZE}` };
  }
  if (MAX_FONT_SIZE < maxFontSize) {
    return { maxFontSize: `more then ${MAX_FONT_SIZE}` };
  }

  if (minFontSize > maxFontSize) {
    return { minFontSize: `more then maxFontSize`, maxFontSize: `less then minFontSize` };
  }

  if (MIN_TAG_BY_TAG_RENDER_INTERVAL > tagByTagRenderInterval) {
    return { tagByTagRenderInterval: `less then ${MIN_TAG_BY_TAG_RENDER_INTERVAL}` };
  }
  if (MAX_TAG_BY_TAG_RENDER_INTERVAL < tagByTagRenderInterval) {
    return { tagByTagRenderInterval: `more then ${MAX_TAG_BY_TAG_RENDER_INTERVAL}` };
  }

  return null;
};

export const Settings = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const { settings } = useSelector((state: RootStateT) => {
    return { settings: state.settings };
  });
  const [values, setValues] = useState(settings);
  const [errors, setErrors] = useState<null | Partial<{ [key in SettingsKeysT]: string }>>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledUpdateSettings = useCallback(
    throttle((data: Partial<RootStateT['settings']>) => {
      dispatch(updateSettings(data));
    }, 1000),
    [dispatch],
  );

  useEffect(() => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (!nextErrors) {
      throttledUpdateSettings(values);
    }
  }, [throttledUpdateSettings, values]);

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }, []);

  const onInputChange = useCallback((e: React.FormEvent<HTMLElement>) => {
    if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) {
      return;
    }
    const { name, value, type } = e.target;
    let inputValue: string | boolean;
    if (e.target instanceof HTMLInputElement && type === 'checkbox') {
      ({ checked: inputValue } = e.target);
    } else {
      inputValue = value;
    }
    setValues((currentValue) => {
      return { ...currentValue, [name]: transformInputValue(name as SettingsKeysT, inputValue) };
    });
  }, []);

  return (
    <form className={classes.form} onSubmit={onSubmit}>
      <SelectFormField
        classes={{ helperText: classes.helperText }}
        helperText={errors?.fontFamily}
        label="fontFamily"
        name="fontFamily"
        options={fontFamilyOptions}
        value={values.fontFamily}
        onChange={onInputChange}
      />
      <InputFormField
        required
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.minFontSize}
        label="minFontSize"
        max={Math.min(MAX_FONT_SIZE, values.maxFontSize)}
        min={MIN_FONT_SIZE}
        name="minFontSize"
        type="number"
        value={values.minFontSize}
        onChange={onInputChange}
      />
      <InputFormField
        required
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.maxFontSize}
        label="maxFontSize"
        max={MAX_FONT_SIZE}
        min={Math.max(MIN_FONT_SIZE, values.minFontSize)}
        name="maxFontSize"
        type="number"
        value={values.maxFontSize}
        onChange={onInputChange}
      />
      <InputFormField
        required
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.sceneMapResolution}
        label="sceneMapResolution"
        max={Math.min(values.minFontSize, MAX_SCENE_MAP_RESOLUTION)}
        min={MIN_SCENE_MAP_RESOLUTION}
        name="sceneMapResolution"
        type="number"
        value={values.sceneMapResolution}
        onChange={onInputChange}
      />
      <CheckboxFormField
        required
        checked={values.shouldTryAnotherAngle}
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.shouldTryAnotherAngle}
        label="shouldTryAnotherAngle"
        name="shouldTryAnotherAngle"
        onChange={onInputChange}
      />
      <InputFormField
        required
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.addIfEmptyIndex}
        label="addIfEmptyIndex"
        min={1}
        name="addIfEmptyIndex"
        type="number"
        value={values.addIfEmptyIndex}
        onChange={onInputChange}
      />
      <SelectFormField
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.pickingClosedVacancyStrategy}
        label="pickingClosedVacancyStrategy"
        name="pickingClosedVacancyStrategy"
        options={pickingStrategiesOptions}
        value={values.pickingClosedVacancyStrategy}
        onChange={onInputChange}
      />
      <SelectFormField
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.pickingEdgeVacancyStrategy}
        label="pickingEdgeVacancyStrategy"
        name="pickingEdgeVacancyStrategy"
        options={pickingStrategiesOptions}
        value={values.pickingEdgeVacancyStrategy}
        onChange={onInputChange}
      />
      <SelectFormField
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.sortingClosedVacanciesStrategy}
        label="sortingClosedVacanciesStrategy"
        name="sortingClosedVacanciesStrategy"
        options={sortingClosedVacanciesOptions}
        value={values.sortingClosedVacanciesStrategy}
        onChange={onInputChange}
      />
      <SelectFormField
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.sortingEdgeVacanciesStrategy}
        label="sortingEdgeVacanciesStrategy"
        name="sortingEdgeVacanciesStrategy"
        options={sortingEdgeVacanciesOptions}
        value={values.sortingEdgeVacanciesStrategy}
        onChange={onInputChange}
      />
      <InputFormField
        required
        classes={{ helperText: classes.helperText, root: classes.notFirstFormControl }}
        helperText={errors?.tagByTagRenderInterval}
        label="tagByTagRenderInterval"
        max={MAX_TAG_BY_TAG_RENDER_INTERVAL}
        min={MIN_TAG_BY_TAG_RENDER_INTERVAL}
        name="tagByTagRenderInterval"
        type="number"
        value={values.tagByTagRenderInterval}
        onChange={onInputChange}
      />
    </form>
  );
};
