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
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies for one rect laid at sceneMap', () => {
    sceneMap.bulkUpdate([[1, 1, true], [2, 1, true], [1, 2, true], [2, 2, true]]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies for one rect laid at sceneMap', () => {
    sceneMap.bulkUpdate([
      [1, 1, true], [2, 1, true], [3, 1, true],
      [1, 2, true], [3, 2, true],
      [1, 3, true], [2, 3, true], [3, 3, true],
    ]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    expect(vacanciesManager.closedVacancies).toStrictEqual([
      {
        bottom: 2,
        cols: 1,
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
    sceneMap.bulkUpdate([[1, 1, true], [2, 1, true], [1, 2, true],]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const topRightEdgeVacancy = {
      baseSize: Infinity,
      bottom: 2,
      left: 2,
      right: Infinity,
      rightEdge: 2,
      top: Infinity,
      topEdge: 2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([topRightEdgeVacancy]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([topRightEdgeVacancy]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies in the bottom right conner of the sceneMap', () => {
    sceneMap.bulkUpdate([[1, -1, true], [2, -1, true], [1, -2, true]]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const bottomRightEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdge: -2,
      left: 2,
      right: Infinity,
      rightEdge: 2,
      top: -2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([bottomRightEdgeVacancy]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomRightEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([]);
  });
  it('correct vacancies in the bottom left conner of the sceneMap', () => {
    sceneMap.bulkUpdate([[-1, -1, true], [-2, -1, true], [-1, -2, true]]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const bottomLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdge: -2,
      left: -Infinity,
      leftEdge: -2,
      right: -2,
      top: -2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
  });
  it('correct vacancies in the top left conner of the sceneMap', () => {
    sceneMap.bulkUpdate([[-1, 1, true], [-2, 1, true], [-1, 2, true]]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const topLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: 2,
      left: -Infinity,
      leftEdge: -2,
      right: -2,
      top: Infinity,
      topEdge: 2,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([topLeftEdgeVacancy]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([topLeftEdgeVacancy]);
  });
  it('correct vacancy at 1, 1 position of the sceneMap', () => {
    sceneMap.bulkUpdate([[2, 1, true], [1, 2, true], [2, 2, true]]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const bottomLeftEdgeVacancy = {
      baseSize: Infinity,
      bottom: -Infinity,
      bottomEdge: 1,
      left: -Infinity,
      leftEdge: 1,
      right: 1,
      top: 1,
    };
    expect(vacanciesManager.closedVacancies).toStrictEqual([]);
    expect(vacanciesManager.topEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.rightEdgeVacancies).toStrictEqual([]);
    expect(vacanciesManager.bottomEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
    expect(vacanciesManager.leftEdgeVacancies).toStrictEqual([bottomLeftEdgeVacancy]);
  });
  it('two closed vacancies, test removeClosedVacancy', () => {
    sceneMap.bulkUpdate([
      [-1, -1, true], [1, -1, true], [2, -1, true], [3, -1, true], [4, -1, true],
      [-1, 1, true], [4, 1, true],
      [-1, 2, true], [3, 2, true], [4, 2, true],
      [-1, 3, true], [3, 3, true], [4, 3, true],
      [-1, 4, true], [1, 4, true], [2, 4, true], [3, 4, true], [4, 4, true],
    ]);
    sceneMap.calcSceneSize();
    vacanciesManager.buildVacanciesMap();
    const closedVacancies = [
      {
        bottom: 1,
        cols: 3,
        left: 1,
        right: 3,
        rows: 1,
        square: 3,
        top: 1,
      },
      {
        bottom: 1,
        cols: 2,
        left: 1,
        right: 2,
        rows: 3,
        square: 6,
        top: 3,
      },
    ];
    expect(vacanciesManager.closedVacancies).toStrictEqual(closedVacancies);
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
});
