import IntersectionError from './IntersectionError';

const X = 'x';
const MINUS_X = '-x';
const Y = 'y';
const MINUS_Y = '-y';

function sceneMap() {
	this.sceneMap = {
		'xy': [],
		'x-y': [],
		'-x-y': [],
		'-xy': []
	};
	this.sizeX = 0;
	this.sizeMinusX = 0;
	this.sizeY = 0;
	this.sizeMinusY = 0;	
}

function calcQuarter(xIsPositive, yIsPositive) {
	return `${xIsPositive ? '' : '-'}x${yIsPositive ? '' : '-'}y`;
}

sceneMap.prototype.getSceneSize = function getSceneSize() {
	const {sizeX, sizeMinusX, sizeY, sizeMinusY} = this;	
	return {[X]: sizeX, [MINUS_X]: sizeMinusX, [Y]: sizeY, [MINUS_Y]: sizeMinusY};
}

sceneMap.prototype.calcSceneSize = function getSceneSize() {
  //Y
	if (this.sceneMap['xy'].length > this.sizeY) {
    this.sizeY = this.sceneMap['xy'].length;
	}

  if (this.sceneMap['-xy'].length > this.sizeY) {
    this.sizeY = this.sceneMap['-xy'].length;
  }
	//-Y
  if (this.sceneMap['x-y'].length > this.sizeMinusY) {
    this.sizeMinusY = this.sceneMap['x-y'].length
  }
  if (this.sceneMap['x-y'].length > this.sizeMinusY) {
    this.sizeMinusY = this.sceneMap['x-y'].length
  }

  //X
  this.sceneMap['xy'].forEach(row => {
    if (row.length > this.sizeX) {
      this.sizeX = row.length;
    }
  });
  this.sceneMap['x-y'].forEach(row => {
    if (row.length > this.sizeX) {
      this.sizeX = row.length;
    }
  });
	//-X
  this.sceneMap['-xy'].forEach(row => {
    if (row.length > this.sizeMinusX) {
      this.sizeMinusX = row.length;
    }
  });
  this.sceneMap['-x-y'].forEach(row => {
    if (row.length > this.sizeMinusX) {
      this.sizeMinusX = row.length;
    }
  });
}

sceneMap.prototype._setDataAtPosition = function setDataAtPosition(x, y, val = true) {
  const xIsPositive = x >= 0;
  const yIsPositive = y >= 0;
  const quarter = calcQuarter(xIsPositive, yIsPositive);
  const row = Math.abs(y);
  const col = Math.abs(x);
  if (!Array.isArray(this.sceneMap[quarter][Math.abs(y)])) {
    this.sceneMap[quarter][row] = [];
  }
  this.sceneMap[quarter][row][col] = val;
}

sceneMap.prototype.setDataAtPosition = function setDataAtPosition(x, y, val = true) {
	if (typeof x !== 'number' || typeof y !== 'number') {
		throw new Error('setDataAtPosition error: typeof x !== number || typeof y !== number');
	}
	if (x === 0 || y === 0) {
		throw new Error('setDataAtPosition error: x === 0 || y === 0');
	}
	if (this.getDataAtPosition(x, y)) {
		throw new IntersectionError();
	}
  this._setDataAtPosition(x, y);
}

sceneMap.prototype.releasePosition = function(x, y) {
  this._setDataAtPosition(x, y, undefined);
}

sceneMap.prototype.getDataAtPosition = function getDataAtPosition(x, y) {
	if (typeof x !== 'number' || typeof y !== 'number') {
		throw new Error('getDataAtPosition error: typeof x !== number || typeof y !== number');
	}
	if (x === 0 || y === 0) {
		throw new Error('getDataAtPosition error: x === 0 || y === 0');
	}	
	const quarter = calcQuarter(x >= 0, y >= 0);
	const row = Math.abs(y);
	const col = Math.abs(x);
	if (!Array.isArray(this.sceneMap[quarter][row])) {
		return;
	}	
	return this.sceneMap[quarter][row][col];
}

sceneMap.prototype.drawItself = function drawItself() {
	//сверху вниз
	const sceneSize = this.getSceneSize();
	const topRow = sceneSize[Y];
	const bottomRow = -sceneSize[MINUS_Y];
	const leftCol = -sceneSize[MINUS_X];
	const rightCol = sceneSize[X];
	
	let res = '';	

	for (let row = topRow; row >= bottomRow; row--) {				
		for (let col = leftCol; col <= rightCol; col++) {
			if (row === 0) {
				res +=  '-';				
			} else {
				res += col === 0 ? '|' : this.getDataAtPosition(col, row) ? '#' : '.';
			}
		}
		res += '\n';
	}

	console.log(res, '\n\n');	
}

sceneMap.rectSizeToPositionUnits = function (rectSize, ratio) {
	return Math.ceil(rectSize / ratio);
}

sceneMap.rectToSceneMap = function rectToSceneMap(rectVal, ratio) {
	return Math.sign(rectVal)*Math.ceil(Math.abs(rectVal / ratio));
}

sceneMap.sceneMapToRect = function sceneMapToRect(mapVal, ratio) {
	return mapVal * ratio;
}

sceneMap.countPositions = function(begin, end) {
	if (begin > end) {
    throw new Error('countPositions error: can not be begin > end');
	}
  if (begin === 0 || end === 0) {
    throw new Error('countPositions error: begin, end can not be zero');
  }
	return begin < 0 && end > 0 ? end - begin : end - begin + 1;
}

sceneMap.takePositionsFromFirst = function(first, count) {
  if (count <= 0) throw new Error('"count" must be positive');
  if (first === 0) throw new Error('"first" can not be zero');
  if (count === 1) return first;
  let res = first + count;
  if (!(first < 0 && res >= 0)) {
    res--;
  }
  return res;
}

sceneMap.takePositionsFromLast = function(last, count) {
  if (count <= 0) throw new Error('"count" must be positive');
  if (last === 0) throw new Error('"last" can not be zero');
  if (count === 1) return last;

  let res = last - count;
  if (res >= 0 || last < 0) {
    res++;
  }
  return res;
}

sceneMap.nextPosition = cur => cur === -1 ? cur + 2 : cur + 1;
sceneMap.prevPosition = cur => cur === 1 ? cur - 2 : cur - 1;
sceneMap.changePosition = (cur, diff) => {
  if (cur === 0) throw new Error('"cur" can not be zero');
  let res = cur + diff;
  if (cur > 0 && res <= 0) {
    res--;
  }
  if (cur < 0 && res >= 0) {
    res++;
  }
  return res;
}

export default sceneMap;
export const dimensions = {X, MINUS_X, MINUS_Y, Y};