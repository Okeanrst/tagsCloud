export enum VacancyKinds {
  closedVacancies = 'closedVacancies',
  topEdgeVacancies = 'topEdgeVacancies',
  bottomEdgeVacancies = 'bottomEdgeVacancies',
  leftEdgeVacancies = 'leftEdgeVacancies',
  rightEdgeVacancies = 'rightEdgeVacancies',
}

export interface VacancyT {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PreparedEdgeVacancyT extends VacancyT {
  baseSize: number;
  distanceFromCenter: number;
}

export interface PreparedTopEdgeVacancyT extends PreparedEdgeVacancyT {
  topEdgeRow: number;
  rightEdgeColumn?: number;
  bottomEdgeRow?: number;
  leftEdgeColumn?: number;
}

export interface PreparedBottomEdgeVacancyT extends PreparedEdgeVacancyT {
  bottomEdgeRow: number;
  topEdgeRow?: number;
  rightEdgeColumn?: number;
  leftEdgeColumn?: number;
}

export interface PreparedLeftEdgeVacancyT extends PreparedEdgeVacancyT {
  leftEdgeColumn: number;
  topEdgeRow?: number;
  rightEdgeColumn?: number;
  bottomEdgeRow?: number;
}

export interface PreparedRightEdgeVacancyT extends PreparedEdgeVacancyT {
  rightEdgeColumn: number;
  topEdgeRow?: number;
  bottomEdgeRow?: number;
  leftEdgeColumn?: number;
}

export interface ClosedVacancyT extends VacancyT {
  square: number;
  rows: number;
  cols: number;
  distanceFromCenter: number;
}

export type CoordinatePointT = { x: number; y: number };

export type PositionT = { col: number; row: number };
