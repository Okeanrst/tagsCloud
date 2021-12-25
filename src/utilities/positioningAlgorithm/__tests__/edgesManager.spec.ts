import { EdgesManager, edgesOrder, EDGE } from '../edgesManager';

const { TOP, RIGHT, BOTTOM, LEFT } = EDGE;
const edgesInOrder = Object.values(EDGE);

describe('EdgesManager tests', () => {
  let edgesManager: EdgesManager;
  beforeEach(() => {
    edgesManager = new EdgesManager();
  });

  it('should be right order', () => {
    const spentEdges = [];

    for (let i = 0; i < edgesOrder.length; i++) {
      const edge = edgesManager.getNextVacanciesEdge(spentEdges);
      spentEdges.push(edge);

      expect(edge).toBe(edgesInOrder[i]);
    }
  });
  it('should return correct edges depending on edges usage', () => {
    expect(edgesManager.getNextEdge(1.5)).toBe(TOP);
    edgesManager.confirmEdgeUsage(TOP);
    expect(edgesManager.getNextEdge(1.5)).toBe(BOTTOM);
    // without preliminary confirmation
    expect(edgesManager.getNextEdge(1.5)).toBe(BOTTOM);

    expect(edgesManager.getNextEdge(0.5)).toBe(RIGHT);
    edgesManager.confirmEdgeUsage(RIGHT);
    expect(edgesManager.getNextEdge(0.5)).toBe(LEFT);
    edgesManager.confirmEdgeUsage(LEFT);
    expect(edgesManager.getNextEdge(0.5)).toBe(RIGHT);
  });
});
