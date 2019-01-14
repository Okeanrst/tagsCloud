'use strict';

const SceneMap = require('./sceneMap');
const {dimensions} = require('./sceneMap');
const {X, MINUS_X, MINUS_Y, Y} = dimensions;

function findVacancies(sceneMap, addIfEmpty = true) {
	const closedVacancies = [];
	const topEdgeVacancies = [];
	const rightEdgeVacancies = [];
	const bottomEdgeVacancies = [];
	const leftEdgeVacancies = [];

	const sceneSize = sceneMap.getSceneSize();
	//свнизу вверх, слева направо
	const topRow = sceneSize[Y];
	const bottomRow = -sceneSize[MINUS_Y];
	const leftCol = -sceneSize[MINUS_X];
	const rightCol = sceneSize[X];
	const accumulated = {};

	const next = SceneMap.nextPosition;
	const prev = SceneMap.prevPosition;
	const change = SceneMap.changePosition;

	function extractVacancies (toCloseCols, curRow) {
		//отфильтровываем рядом стоящие, идущие на закрытие (будет сохранена самая правая колонка)
		const toCloseColsDedupl = toCloseCols.filter((curItemCol, index) => {
			const nextItemCol = toCloseCols[index + 1];			
			return nextItemCol !== next(curItemCol);
		});

		const baseLines = [];

		const spreadLine = (begin, end) => {
			const line = {begin, end};
			begin = prev(begin);
			while (accumulated[begin]) {
				line.begin = begin;
				begin = prev(begin);
			}
			end = next(end);
			while (accumulated[end]) {
				line.end = end;
				end = next(end);
			}
			return line;
		}

		toCloseColsDedupl.forEach(col => {
			baseLines.push(spreadLine(col, col));
		});

		const restorer = str => {
			const parts = str.split(' ');
			return {begin: +parts[0], end: +parts[1]};
		}

		let baseLinesDedupl = baseLines;
		if (baseLines.length > 1) {
			baseLinesDedupl = [...(new Set(baseLines.map(l => `${l.begin} ${l.end}`)).values())].map(restorer);
		}		 

		const oppositeLines = [];
		baseLinesDedupl.forEach(line => {
			let begin = line.begin;
			let end = line.end;
			let prevColVal = accumulated[begin];
			for (let col = line.begin; col <= line.end; col = next(col)) {				
				if (accumulated[col] !== prevColVal) {
					oppositeLines.push({begin, end, val: prevColVal});
					begin = col;
				}
				prevColVal = accumulated[col];
				end = col;
			}

			oppositeLines.push({begin, end, val: prevColVal});
		});		

		//spread opposite line
		oppositeLines.forEach(line => {			
			let begin = prev(line.begin);
			while (accumulated[begin] >= line.val) {
				line.begin = begin;
				begin = prev(begin);
			}
			let end = next(line.end);
			while (accumulated[end] >= line.val) {
				line.end = end;
				end = next(end);
			}
		});

		oppositeLines.forEach(line => {
			let top = prev(curRow);
			let right = line.end;
			let bottom = change(curRow, -line.val);
			let left = line.begin;			
			const vacancy = {top, right, bottom, left};			 

			let closed = true;
			if (top === topRow) {
        vacancy.topEdge = top;
        vacancy.top = Infinity;
				topEdgeVacancies.push(vacancy);
				closed = false;
			}			
			if (right === rightCol) {
        vacancy.rightEdge = right;
        vacancy.right = Infinity;
				rightEdgeVacancies.push(vacancy);
				closed = false;
			}
			if (bottom === bottomRow) {
        vacancy.bottomEdge = bottom;
        vacancy.bottom = -Infinity;
				bottomEdgeVacancies.push(vacancy);
				closed = false;
			}
			if (left === leftCol) {
        vacancy.leftEdge = left;
				vacancy.left = -Infinity;
				leftEdgeVacancies.push(vacancy);
				closed = false;
			}
			if (closed) {
				closedVacancies.push(vacancy);
			}
		});
  }

	for (let col = leftCol; col <= rightCol; col = next(col)) {		
		accumulated[col] = 0;
	}
	for (let row = bottomRow; row <= topRow; row = next(row)) {		
		const currentRow = {};
		const toCloseCols = [];
		for (let col = leftCol; col <= rightCol; col = next(col)) {
			currentRow[col] = sceneMap.getDataAtPosition(col, row);
			if (currentRow[col] && accumulated[col]) {				
				toCloseCols.push(col);
			}		
		}

		extractVacancies(toCloseCols, row);		
				
		for (let col = leftCol; col <= rightCol; col = next(col)) {
			if (currentRow[col]) {
				accumulated[col] = 0;				
			} else {
				accumulated[col]++;
			}
		}
	}

	const toCloseCols = [];
	for (let col = leftCol; col <= rightCol; col = next(col)) {
		if (accumulated[col]) {				
			toCloseCols.push(col);
		}					
	}
	extractVacancies(toCloseCols, next(topRow));

	if (addIfEmpty) {
		if (!topEdgeVacancies.length) {
			topEdgeVacancies.push({top: Infinity, bottom: next(topRow), right: Infinity, left: -Infinity});
		}
		if (!bottomEdgeVacancies.length) {
			bottomEdgeVacancies.push({top: prev(bottomRow), bottom: -Infinity, right: Infinity, left: -Infinity});
		}
		if (!rightEdgeVacancies.length) {
			rightEdgeVacancies.push({top: Infinity, bottom: -Infinity, right: Infinity, left: next(rightCol)});
		}
		if (!leftEdgeVacancies.length) {
			leftEdgeVacancies.push({top: Infinity, bottom: -Infinity, right: prev(leftCol), left: -Infinity});
		}
	}

	return {topEdgeVacancies, rightEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies, closedVacancies};
}

module.exports = findVacancies;