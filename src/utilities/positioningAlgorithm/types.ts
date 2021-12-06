export interface VacancyT {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PreparedTopEdgeVacancyT extends VacancyT {
  baseSize: number;
  topEdge: number;
  rightEdge?: number;
  bottomEdge?: number;
  leftEdge?: number;
}

export interface PreparedBottomEdgeVacancyT extends VacancyT {
  baseSize: number;
  bottomEdge: number;
  topEdge?: number;
  rightEdge?: number;
  leftEdge?: number;
}

export interface PreparedLeftEdgeVacancyT extends VacancyT {
  baseSize: number;
  leftEdge: number;
  topEdge?: number;
  rightEdge?: number;
  bottomEdge?: number;
}

export interface PreparedRightEdgeVacancyT extends VacancyT {
  baseSize: number;
  rightEdge: number;
  topEdge?: number;
  bottomEdge?: number;
  leftEdge?: number;
}

export interface ClosedVacancyT extends VacancyT {
  square: number;
  rows: number;
  cols: number;
}
