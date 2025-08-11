import { RootStateT } from '../../store/types';

export type DraggableTagT = { id: string; changeRotation: boolean };

export type CoordinatesT = { x: number; y: number };

export type VacanciesT = NonNullable<RootStateT['tagsCloud']['vacancies']>;
