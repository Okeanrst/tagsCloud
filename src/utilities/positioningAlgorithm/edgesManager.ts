export enum EDGE {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
}

const { TOP, RIGHT, BOTTOM, LEFT } = EDGE;

type EdgesStatisticsT = {
  [TOP]: number;
  [RIGHT]: number;
  [BOTTOM]: number;
  [LEFT]: number;
};

export const edgesOrder: ReadonlyArray<EDGE> = [TOP, RIGHT, BOTTOM, LEFT];

export class EdgesManager {
  private edgesStatistics: EdgesStatisticsT = {
    [TOP]: 0,
    [RIGHT]: 0,
    [BOTTOM]: 0,
    [LEFT]: 0,
  };

  private vacanciesEdgesStatistics = {
    [TOP]: 0,
    [RIGHT]: 0,
    [BOTTOM]: 0,
    [LEFT]: 0,
  };

  getNextEdge(sizeRatio: number) {
    const availableEdges = sizeRatio === 1 ? edgesOrder : sizeRatio < 1 ? [RIGHT, LEFT] : [TOP, BOTTOM];

    const sortedAvailableEdges = [...availableEdges].sort((a: EDGE, b: EDGE): number => {
      return this.edgesStatistics[a] - this.edgesStatistics[b];
    });

    return sortedAvailableEdges[0];
  }

  confirmEdgeUsage(usedEdge: EDGE) {
    this.edgesStatistics[usedEdge]++;
  }

  getNextVacanciesEdge(spentEdges: ReadonlyArray<EDGE>) {
    const edges = edgesOrder
      .filter((edge) => !spentEdges.includes(edge))
      .sort((a: EDGE, b: EDGE): number => {
        return this.edgesStatistics[a] - this.edgesStatistics[b];
      });

    if (!edges.length) {
      throw new Error('getNextVacanciesEdge error: edges is empty');
    }

    const edge = edges[0];
    this.vacanciesEdgesStatistics[edge]++;
    return edge;
  }
}
