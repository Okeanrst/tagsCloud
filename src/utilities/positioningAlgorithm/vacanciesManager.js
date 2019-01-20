import findVacanciesMap from './findVacanciesMap';
import SceneMap, { dimensions } from './sceneMap';

export default class VacanciesManager {
	constructor(sceneMap) {
		this.sceneMap = sceneMap;

		this.closedVacancies = [];

		this.topEdgeVacancies = [];
		this.rightEdgeVacancies = [];
		this.bottomEdgeVacancies = [];
		this.leftEdgeVacancies = [];
	}

	findVacancies(addIfEmpty = false) {
		const {
			topEdgeVacancies: topEdgeVacanciesMap, rightEdgeVacancies: rightEdgeVacanciesMap,
			bottomEdgeVacancies: bottomEdgeVacanciesMap, leftEdgeVacancies: leftEdgeVacanciesMap,
			closedVacancies: closedVacanciesMap
		} = findVacanciesMap(this.sceneMap, addIfEmpty);

		const prepareClosedVacancy = VacanciesManager.prepareClosedVacancy;

		this.closedVacancies = closedVacanciesMap.map(v => prepareClosedVacancy(v));
		VacanciesManager.sortVacanciesBySquare(this.closedVacancies);

		const prepareEdgeVacancy = VacanciesManager.prepareEdgeVacancy;
		this.topEdgeVacancies = topEdgeVacanciesMap.map(v => prepareEdgeVacancy(v,'width'));
		VacanciesManager.sortVacanciesByBaseSize(this.topEdgeVacancies);
		this.rightEdgeVacancies = rightEdgeVacanciesMap.map(v => prepareEdgeVacancy(v, 'height'));
		VacanciesManager.sortVacanciesByBaseSize(this.rightEdgeVacancies);
		this.bottomEdgeVacancies = bottomEdgeVacanciesMap.map(v => prepareEdgeVacancy(v, 'width'));
		VacanciesManager.sortVacanciesByBaseSize(this.bottomEdgeVacancies);
		this.leftEdgeVacancies = leftEdgeVacanciesMap.map(v => prepareEdgeVacancy(v, 'height'));
		VacanciesManager.sortVacanciesByBaseSize(this.leftEdgeVacancies);
	}	

	removeClosedVacancy(index) {
		this.closedVacancies[index] = undefined;	
	}

	filterUnsuitableClosedVacancies(vacancyApprover) {
		this.closedVacancies.filter(vacancyApprover);		
	}
}

VacanciesManager.drawVacancy = function drawVacancy(vacancy, sceneSize) {
	if (!vacancy) return;
	
	const v = vacancy;
	const infin = (v) => !Number.isFinite(v);
	if ([v.top, v.bottom, v.left, v.right].filter(i => infin(i)).length >= 3) {
		return;
	}	
	//сверху вниз
	const {Y, X, MINUS_Y, MINUS_X} = dimensions;
	const topRow = sceneSize[Y];
	const bottomRow = -sceneSize[MINUS_Y];
	const leftCol = -sceneSize[MINUS_X];
	const rightCol = sceneSize[X];	
	
	let res = '';

	const isBelongVacancy = (x, y) => {		
		return v.top >= y && v.bottom <= y && v.left <= x && v.right >= x;
	};

	for (let row = topRow; row >= bottomRow; row--) {				
		for (let col = leftCol; col <= rightCol; col++) {
			if (row === 0) {
				res +=  '-';				
			} else {
				res += col === 0 ? '|' : isBelongVacancy(col, row) ? '#' : '.';
			}
		}
		res += '\n';
	}

	console.log(res, '\n\n');	
}

VacanciesManager.sortVacanciesByBaseSize = function (vacancies) {
	vacancies.sort((a, b) => a.baseSize - b.baseSize);
}

VacanciesManager.sortVacanciesBySquare = function sortVacanciesSquare(vacancies) {
	vacancies.sort((a, b) => a.square - b.square);
}

//baseSize one of ['width', 'height']
VacanciesManager.prepareEdgeVacancy = function (vacancy, baseSize) {
	if (baseSize === 'width') {
		vacancy.baseSize = vacancy.right - vacancy.left + 1;
	} else {
		vacancy.baseSize = vacancy.top - vacancy.bottom + 1;
	}
	return vacancy;
}

VacanciesManager.prepareClosedVacancy = function (vacancy) {
  const v = vacancy;
  const debug = process.env.NODE_ENV !== 'production';
  if (debug && (isNaN(v.top) || isNaN(v.right) || isNaN(v.bottom) || isNaN(v.left))) {
    throw new Error('prepareClosedVacancy error: isNaN(top) || isNaN(right) || isNaN(bottom) || isNaN(left)');
  }
	const rows = SceneMap.countPositions(vacancy.bottom, vacancy.top);
  const cols = SceneMap.countPositions(vacancy.left, vacancy.right);

  if (debug && (rows <= 0 || cols <= 0)) {
    throw new Error('prepareClosedVacancy error: rows <= 0 || cols <= 0');
  }
	return Object.assign(vacancy, {rows, cols, square: rows * cols});
}
