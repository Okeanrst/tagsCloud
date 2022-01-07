import { SceneMap } from '../sceneMap';
import IntersectionError from '../IntersectionError';

describe('SceneMap tests', () => {
  describe('rectSizeToSceneMapUnits tests', () => {
    it('should return correct result', () => {
      expect(SceneMap.rectSizeToSceneMapUnits(8, 2)).toBe(4);
    });
    it('should return correct result (not fractional result)', () => {
      expect(SceneMap.rectSizeToSceneMapUnits(9, 2)).toBe(5);
    });
  });

  describe('sceneMapUnitsToRect tests', () => {
    it('should return correct result', () => {
      expect(SceneMap.sceneMapUnitsToRect(8, 2)).toBe(16);
    });
  });

  describe('calcNextPositionFromEdge tests', () => {
    it('should return correct result for negative edge', () => {
      expect(SceneMap.calcNextPositionFromEdge(-2)).toBe(-2);
    });
    it('should return correct result for positive edge', () => {
      expect(SceneMap.calcNextPositionFromEdge(1)).toBe(2);
    });
    it('should return correct result for 0 edge', () => {
      expect(SceneMap.calcNextPositionFromEdge(0)).toBe(1);
    });
  });

  describe('calcPrevPositionFromEdge tests', () => {
    it('should return correct result for negative edge', () => {
      expect(SceneMap.calcPrevPositionFromEdge(-2)).toBe(-3);
    });
    it('should return correct result for positive edge', () => {
      expect(SceneMap.calcPrevPositionFromEdge(3)).toBe(3);
    });
    it('should return correct result for 0 edge', () => {
      expect(SceneMap.calcPrevPositionFromEdge(0)).toBe(-1);
    });
  });

  describe('changePosition tests', () => {
    it('should return correct result for negative edge', () => {
      expect(SceneMap.changePosition(-2, 0)).toBe(-2);
    });
    it('should throw error for currentPosition is 0', () => {
      expect(() => {
        SceneMap.changePosition(0, 0);
      }).toThrowError(/^currentPosition can not be zero$/);
    });
    it('should return correct result if currentPosition is positive and diff is positive', () => {
      expect(SceneMap.changePosition(1, 5)).toBe(6);
    });
    it('should return correct result if currentPosition is positive and diff is negative', () => {
      expect(SceneMap.changePosition(1, -5)).toBe(-5);
    });
    it('should return correct result if currentPosition is positive and diff is negative (result is not 0)', () => {
      expect(SceneMap.changePosition(1, -1)).toBe(-1);
    });

    it('should return correct result if currentPosition is negative and diff is positive (result is not 0)', () => {
      expect(SceneMap.changePosition(-5, 5)).toBe(1);
    });
    it('should return correct result if currentPosition is negative and diff is positive', () => {
      expect(SceneMap.changePosition(-5, 10)).toBe(6);
    });
    it('should return correct result if currentPosition is negative and diff is negative', () => {
      expect(SceneMap.changePosition(-5, -5)).toBe(-10);
    });
  });

  describe('countPositions tests', () => {
    it('should return correct result when begin and end are the same', () => {
      expect(SceneMap.countPositions(2, 2)).toBe(1);
    });
    it('should return correct result when begin and end are positive', () => {
      expect(SceneMap.countPositions(2, 5)).toBe(4);
    });
    it('should return correct result when begin is negative, end is positive', () => {
      expect(SceneMap.countPositions(-2, 3)).toBe(5);
    });
    it('should return correct result when begin and end are negative', () => {
      expect(SceneMap.countPositions(-5, -2)).toBe(4);
    });
    it('should throw error for when position is 0', () => {
      expect(() => {
        SceneMap.countPositions(0, 0);
      }).toThrowError(/begin, end can not be zero/);
    });
    it('should throw error for when position is 0', () => {
      expect(() => {
        SceneMap.countPositions(5, 1);
      }).toThrowError(/can not be begin > end/);
    });
  });

  describe('countPositionsFroward tests', () => {
    it('should return correct result for (1, 1)', () => {
      expect(SceneMap.countPositionsFroward(1, 1)).toBe(1);
    });
    it('should return correct result for (1, 2)', () => {
      expect(SceneMap.countPositionsFroward(1, 2)).toBe(2);
    });
    it('should return correct result for (-1, 1)', () => {
      expect(SceneMap.countPositionsFroward(-1, 1)).toBe(-1);
    });
    it('should return correct result for (-3, 4)', () => {
      expect(SceneMap.countPositionsFroward(-3, 4)).toBe(1);
    });
    it('should throw error for currentPosition is 0', () => {
      expect(() => {
        SceneMap.countPositionsFroward(0, 1);
      }).toThrowError(/^startPosition can not be zero$/);
    });
    it('should throw error for count is 0', () => {
      expect(() => {
        SceneMap.countPositionsFroward(10, 0);
      }).toThrowError(/^count must be positive$/);
    });
  });

  describe('countPositionsBackwards tests', () => {
    it('should return correct result for (1, 1)', () => {
      expect(SceneMap.countPositionsBackwards(1, 1)).toBe(1);
    });
    it('should return correct result for (1, 2)', () => {
      expect(SceneMap.countPositionsBackwards(1, 2)).toBe(-1);
    });
    it('should return correct result for (-1, 1)', () => {
      expect(SceneMap.countPositionsBackwards(-1, 1)).toBe(-1);
    });
    it('should return correct result for (-3, 3)', () => {
      expect(SceneMap.countPositionsBackwards(-3, 3)).toBe(-5);
    });
    it('should throw error for currentPosition is 0', () => {
      expect(() => {
        SceneMap.countPositionsBackwards(0, 1);
      }).toThrowError(/^startPosition can not be zero$/);
    });
    it('should throw error for count is 0', () => {
      expect(() => {
        SceneMap.countPositionsBackwards(10, 0);
      }).toThrowError(/^count must be positive$/);
    });
  });

  describe('calcSceneEdges and getSceneEdges tests', () => {
    let sceneMap: SceneMap;
    beforeEach(() => {
      sceneMap = new SceneMap();
    });

    it('getSceneEdges should return correct value for init sceneMap state', () => {
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': 0,
        '-y': 0,
        x: 0,
        y: 0,
      });
    });
    it('getSceneEdges should return correct value after setting data at position', () => {
      sceneMap.occupyPosition(1, 1);
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': 0,
        '-y': 0,
        x: 0,
        y: 0,
      });
      sceneMap.calcSceneEdges();
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': 0,
        '-y': 0,
        x: 1,
        y: 1,
      });
    });
    it('getSceneEdges should return correct value after setting data at position and releasing some of them', () => {
      sceneMap.occupyPosition(2, 2);
      sceneMap.occupyPosition(-2, 2);
      sceneMap.occupyPosition(2, -2);
      sceneMap.occupyPosition(-2, -2);
      sceneMap.calcSceneEdges();
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': -2,
        '-y': -2,
        x: 2,
        y: 2,
      });
      sceneMap.releasePosition(1, 1);
      sceneMap.calcSceneEdges();
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': -2,
        '-y': -2,
        x: 2,
        y: 2,
      });
      sceneMap.releasePosition(2, 2);
      sceneMap.releasePosition(-2, 2);
      sceneMap.calcSceneEdges();
      // not expect(sceneMap.getSceneEdges()).toStrictEqual({'-x': -2, '-y': -2, 'x': 1, 'y': 2});
      // map rebuild is required
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': -2,
        '-y': -2,
        x: 2,
        y: 2,
      });
    });
    it('getSceneEdges should return correct values after successful bulkOccupyPosition', () => {
      sceneMap.bulkOccupyPosition([[1, 1], [2, 1], [3, 1]]);
      sceneMap.calcSceneEdges();
      expect(sceneMap.getSceneEdges()).toStrictEqual({
        '-x': 0,
        '-y': 0,
        x: 3,
        y: 1,
      });
    });
    it('getDataAtPosition should return correct value after unsuccessful bulkOccupyPosition', () => {
      sceneMap.occupyPosition(3, 1);
      expect(() => {
        sceneMap.bulkOccupyPosition([[1, 1], [2, 1], [3, 1]]);
      }).toThrowError(IntersectionError);
      expect(sceneMap.getDataAtPosition(3, 1)).toBe(true);
      expect(sceneMap.getDataAtPosition(2, 1)).toBe(false);
    });
  });

  describe('occupyPosition and getDataAtPosition tests', () => {
    let sceneMap: SceneMap;
    let position: { x: number; y: number };
    beforeEach(() => {
      sceneMap = new SceneMap();
      position = {
        x: Math.ceil(Math.random() * 100),
        y: Math.ceil(Math.random() * 100),
      };
    });
    it('getDataAtPosition should return correct value after it is set with occupyPosition', () => {
      const { x, y } = position;
      sceneMap.occupyPosition(x, y);
      expect(sceneMap.getDataAtPosition(x, y)).toBe(true);
    });
    it('position should not have value after in is released', () => {
      const { x, y } = position;
      sceneMap.occupyPosition(x, y);
      sceneMap.releasePosition(x, y);
      expect(sceneMap.getDataAtPosition(x, y)).not.toBe(true);
    });
    it('should throw an error when try to set data at occupied position', () => {
      const { x, y } = position;
      sceneMap.occupyPosition(x, y);
      expect(() => {
        sceneMap.occupyPosition(x, y);
      }).toThrowError(/^The position \(x: [\d]+, y: [\d]+\) is occupied$/);
    });
    it('should throw an error when try to set data at position with incorrect coordinates', () => {
      expect(() => {
        sceneMap.occupyPosition(0, 0);
      }).toThrowError(/^occupyPosition error: x === 0 \|\| y === 0$/);
    });
  });

  describe('toPositions tests', () => {
    let sceneMap: SceneMap;
    beforeEach(() => {
      sceneMap = new SceneMap();
    });
    it('should return the same positions', () => {
      const originPositions: [number, number][] = [
        [-2, 3], [-1, 3], [1, 3], [2, 3], [3, 3], [-1, 2], [1, 2], [-1, 1], [1, 1],
        [-1, -1], [1, -1], [-1, -2], [1, -2], [-1, -3], [1, -3]
      ];
      sceneMap.bulkOccupyPosition(originPositions);
      expect(sceneMap.toPositions()).toStrictEqual(originPositions);
    });
  });
});
