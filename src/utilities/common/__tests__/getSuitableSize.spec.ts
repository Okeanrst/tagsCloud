import { getSuitableSize } from '../getSuitableSize';

describe('getSuitableSize', () => {
  const testCases = [
    // Square container
    {
      args: { availableSize: { width: 10, height: 10 }, aspectRatio: 1, scale: 1 },
      expected: { width: 10, height: 10 },
    },
    {
      args: { availableSize: { width: 10, height: 10 }, aspectRatio: 2, scale: 1 },
      expected: { width: 10, height: 5 },
    },
    {
      args: { availableSize: { width: 10, height: 10 }, aspectRatio: 0.5, scale: 1 },
      expected: { width: 5, height: 10 },
    },
    {
      args: { availableSize: { width: 10, height: 10 }, aspectRatio: 0.5, scale: 2 },
      expected: { width: 10, height: 10 },
    },

    // Tall container
    { args: { availableSize: { width: 2, height: 4 }, aspectRatio: 1, scale: 1.5 }, expected: { width: 2, height: 3 } },
    { args: { availableSize: { width: 2, height: 4 }, aspectRatio: 1, scale: 2 }, expected: { width: 2, height: 4 } },
    { args: { availableSize: { width: 2, height: 4 }, aspectRatio: 1, scale: 3 }, expected: { width: 2, height: 4 } },

    // Wide container
    { args: { availableSize: { width: 4, height: 2 }, aspectRatio: 1, scale: 1 }, expected: { width: 2, height: 2 } },
    { args: { availableSize: { width: 4, height: 2 }, aspectRatio: 1, scale: 1.5 }, expected: { width: 3, height: 2 } },
    { args: { availableSize: { width: 4, height: 2 }, aspectRatio: 1, scale: 2 }, expected: { width: 4, height: 2 } },
    { args: { availableSize: { width: 4, height: 2 }, aspectRatio: 1, scale: 3 }, expected: { width: 4, height: 2 } },
  ];

  test.each(testCases)('should return $expected for args $args', ({ args, expected }) => {
    const result = getSuitableSize(args);
    // Using toBeCloseTo for potential floating point inaccuracies, although not strictly needed here.
    expect(result.width).toBeCloseTo(expected.width);
    expect(result.height).toBeCloseTo(expected.height);
  });
});
