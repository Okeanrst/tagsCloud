import { getSceneMapVacancies } from '../utilities/positioningAlgorithm/calcTagsPositions';
import { PositionT, SceneMap } from '../utilities/positioningAlgorithm/sceneMap';
import { drawVacancy } from '../utilities/positioningAlgorithm/vacanciesManager';
import { VacancyKinds } from 'utilities/positioningAlgorithm/types';

// sceneMap 8
const sceneMapPositions8: PositionT[] = [
  [1, -1], [3, -1],
  [1, -2],
  [1, -3], [3, -3],
  [1, -4], [3, -4],
];

// sceneMap 7
const sceneMapPositions7: PositionT[] = [
  [1, -1], [2, -1], [3, -1], [4, -1], [5, -1], [6, -1], [7, -1],
  [1, -2], [2, -2], [3, -2], [5, -2], [6, -2], [7, -2],
  [1, -3], [2, -3], [6, -3], [7, -3],
  [1, -4], [7, -4],
];

const sceneMapPositions = sceneMapPositions7;

export const Test = () => {

  const sceneMap = new SceneMap(sceneMapPositions);
  // sceneMap.bulkOccupyPosition(sceneMapPositions);
  sceneMap.drawItself();

  sceneMap.calcSceneEdges();
  const sceneEdges = sceneMap.getSceneEdges();
  console.log(sceneEdges);
  const vacancies = getSceneMapVacancies(sceneMap);
  // console.log(bottomEdgeVacancies);
  // VacancyKinds
  console.log('topEdgeVacancies');
  vacancies.topEdgeVacancies.forEach(v =>
    drawVacancy(v, sceneEdges),
  );
  console.log('bottomEdgeVacancies', vacancies.bottomEdgeVacancies);
  vacancies.bottomEdgeVacancies.forEach(v =>
    drawVacancy(v, sceneEdges),
  );
  console.log('rightEdgeVacancies');
  vacancies.rightEdgeVacancies.forEach(v =>
    drawVacancy(v, sceneEdges),
  );
  console.log('leftEdgeVacancies');
  vacancies.leftEdgeVacancies.forEach(v =>
    drawVacancy(v, sceneEdges),
  );

  vacancies.closedVacancies.forEach(vacancy => {
    if (!vacancy) {
      return;
    }
    drawVacancy(vacancy, sceneEdges);
  });
  return null;
};
