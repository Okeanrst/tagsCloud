import { VacanciesManager } from '../vacanciesManager';
import { SceneMap } from '../sceneMap';

describe('VacanciesManager tests', () => {
  let sceneMap: SceneMap;
  let vacanciesManager: VacanciesManager;
  beforeEach(() => {
    sceneMap = new SceneMap();
    vacanciesManager = new VacanciesManager(sceneMap);
  });
  it('correct vacancies for empty sceneMap', () => {
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies for one rect laid at sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies for one rect laid at sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([
      {
        bottom: 2,
        cols: 1,
        distanceFromCenter: 0.7071067811865476,
        left: 2,
        right: 2,
        rows: 1,
        square: 1,
        top: 2,
      },
    ]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies in the top right conner of the sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const topRightEdgeVacancy = {
      baseSize: Infinity,
      bottom: 2,
      distanceFromCenter: 1.4142135623730951,
      left: 2,
      right: Infinity,
      rightEdgeColumn: 2,
      top: Infinity,
      topEdgeRow: 2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([topRightEdgeVacancy]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([topRightEdgeVacancy]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies in the bottom right conner of the sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [1, -1],
      [2, -1],
      [1, -2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const bottomRightEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdgeRow: -2,
      distanceFromCenter: 1.4142135623730951,
      left: 2,
      right: Infinity,
      rightEdgeColumn: 2,
      top: -2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([bottomRightEdgeVacancy]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomRightEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies in the bottom left conner of the sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [-1, -1],
      [-2, -1],
      [-1, -2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const bottomLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdgeRow: -2,
      left: -Infinity,
      leftEdgeColumn: -2,
      right: -2,
      top: -2,
      distanceFromCenter: 1.4142135623730951,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
  });
  it('correct vacancies in the top left conner of the sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [-1, 1],
      [-2, 1],
      [-1, 2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const topLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: 2,
      left: -Infinity,
      leftEdgeColumn: -2,
      right: -2,
      top: Infinity,
      topEdgeRow: 2,
      distanceFromCenter: 1.4142135623730951,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([topLeftEdgeVacancy]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([topLeftEdgeVacancy]);
  });
  it('correct vacancy at 1, 1 position of the sceneMap', () => {
    sceneMap.bulkOccupyPosition([
      [2, 1],
      [1, 2],
      [2, 2],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const bottomLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdgeRow: 1,
      left: -Infinity,
      leftEdgeColumn: 1,
      right: 1,
      top: 1,
      distanceFromCenter: 0,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
  });
  it('two closed vacancies, test removeClosedVacancy', () => {
    sceneMap.bulkOccupyPosition([
      [-1, -1],
      [1, -1],
      [2, -1],
      [3, -1],
      [4, -1],
      [-1, 1],
      [4, 1],
      [-1, 2],
      [3, 2],
      [4, 2],
      [-1, 3],
      [3, 3],
      [4, 3],
      [-1, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const closedVacancies = [
      {
        bottom: 1,
        cols: 2,
        distanceFromCenter: 0.5,
        left: 1,
        right: 2,
        rows: 3,
        square: 6,
        top: 3,
      },
    ];

    expect(vacanciesManager.closedVacancies).toMatchInlineSnapshot(`
      Array [
        Object {
          "bottom": 1,
          "cols": 2,
          "distanceFromCenter": 0.5,
          "left": 1,
          "right": 2,
          "rows": 3,
          "square": 6,
          "top": 3,
        },
        Object {
          "bottom": 1,
          "cols": 3,
          "distanceFromCenter": 0.7071067811865476,
          "left": 1,
          "right": 3,
          "rows": 1,
          "square": 3,
          "top": 1,
        },
      ]
    `);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
    vacanciesManager.removeClosedVacancy(1);
    expect(vacanciesManager.closedVacancies).toStrictEqual([closedVacancies[0], undefined]);
    expect(() => {
      vacanciesManager.removeClosedVacancy(1);
    }).toThrowError(/^vacancy index [\d]+ does not exist$/);
  });
  it('should return correct vacancies for sceneMap 1', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [6, 2],
      [1, 3],
      [2, 3],
      [6, 3],
      [1, 4],
      [6, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [6, 5],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;
    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 2', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [6, 2],
      [1, 3],
      [2, 3],
      [6, 3],
      [1, 4],
      [6, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [6, 5],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;
    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 3', () => {
    sceneMap.bulkOccupyPosition([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [6, 2],
      [1, 3],
      [2, 3],
      [6, 3],
      [1, 4],
      [6, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [5, 5],
      [6, 5],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;
    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 4', () => {
    sceneMap.bulkOccupyPosition([
      [1, -1],
      [6, -1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [6, 2],
      [1, 3],
      [2, 3],
      [6, 3],
      [1, 4],
      [6, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [5, 5],
      [6, 5],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;
    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 5', () => {
    sceneMap.bulkOccupyPosition([
      [-1, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [-1, 2],
      [5, 2],
      [-1, 3],
      [2, 3],
      [-1, 4],
      [2, 4],
      [3, 4],
      [5, 4],
      [-1, 5],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();
    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;
    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 6', () => {
    sceneMap.bulkOccupyPosition([
      [-2, 2],
      [-1, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [-2, 1],
      [4, 1],
      [-2, -1],
      [-1, -1],
      [4, -1],
      [-2, -2],
      [3, -2],
      [4, -2],
      [-2, -3],
      [4, -3],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();

    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;

    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 7', () => {
    sceneMap.bulkOccupyPosition([
      [1, -1],
      [2, -1],
      [3, -1],
      [4, -1],
      [5, -1],
      [6, -1],
      [7, -1],
      [1, -2],
      [2, -2],
      [3, -2],
      [5, -2],
      [6, -2],
      [7, -2],
      [1, -3],
      [2, -3],
      [6, -3],
      [7, -3],
      [1, -4],
      [7, -4],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();

    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;

    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 8', () => {
    sceneMap.bulkOccupyPosition([
      [1, -1],
      [3, -1],
      [1, -2],
      [1, -3],
      [3, -3],
      [1, -4],
      [3, -4],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();

    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;

    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
  it('should return correct vacancies for sceneMap 9', () => {
    sceneMap.bulkOccupyPosition([
      [1, 2],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
      [5, 6],
      [6, 6],
      [7, 6],
      [8, 6],
      [1, 5],
      [4, 5],
      [5, 5],
      [6, 5],
      [7, 5],
      [8, 5],
      [1, 4],
      [8, 4],
      [1, 3],
      [8, 3],
      [3, 2],
      [5, 2],
      [6, 2],
      [7, 2],
      [8, 2],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [7, 1],
      [8, 1],
    ]);
    sceneMap.calcSceneEdges();
    vacanciesManager.buildVacanciesMap();

    const { closedVacancies, topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies } =
      vacanciesManager;

    expect({
      closedVacancies,
      topEdgeVacancies,
      rightEdgeVacancies,
      bottomEdgeVacancies,
      leftEdgeVacancies,
    }).toMatchSnapshot();
  });
});
