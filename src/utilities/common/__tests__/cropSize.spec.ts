import { cropSize } from '../cropSize';

describe('cropSize', () => {
  const testCases = [
    { args: { size: { width: 4, height: 2 }, aspectRatio: 1 }, expected: { width: 2, height: 2 } },
    { args: { size: { width: 4, height: 2 }, aspectRatio: 0.5 }, expected: { width: 1, height: 2 } },
    { args: { size: { width: 4, height: 2 }, aspectRatio: 2 }, expected: { width: 4, height: 2 } },
  ];

  test.each(testCases)('should return $expected for args $args', ({ args, expected }) => {
    const result = cropSize(args);
    expect(result.width).toBeCloseTo(expected.width);
    expect(result.height).toBeCloseTo(expected.height);
  });
});
