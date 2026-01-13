import Point from './point';

describe('Point', () => {
  describe('constructor', () => {
    test('creates point with default values (0, 0)', () => {
      const point = new Point();
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    test('creates point with specified x value', () => {
      const point = new Point(10);
      expect(point.x).toBe(10);
      expect(point.y).toBe(0);
    });

    test('creates point with specified x and y values', () => {
      const point = new Point(10, 20);
      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
    });

    test('handles zero values correctly', () => {
      const point = new Point(0, 0);
      expect(point.x).toBe(0);
      expect(point.y).toBe(0);
    });

    test('handles negative values', () => {
      const point = new Point(-10, -20);
      expect(point.x).toBe(-10);
      expect(point.y).toBe(-20);
    });
  });

  describe('setters', () => {
    test('updates x value', () => {
      const point = new Point(0, 0);
      point.x = 50;
      expect(point.x).toBe(50);
    });

    test('updates y value', () => {
      const point = new Point(0, 0);
      point.y = 75;
      expect(point.y).toBe(75);
    });

    test('updates both values independently', () => {
      const point = new Point(10, 20);
      point.x = 100;
      expect(point.x).toBe(100);
      expect(point.y).toBe(20);
      
      point.y = 200;
      expect(point.x).toBe(100);
      expect(point.y).toBe(200);
    });
  });

  describe('onchange callback', () => {
    test('calls onchange when x is set', () => {
      let callCount = 0;
      const point = new Point(0, 0, () => callCount++);
      
      point.x = 10;
      expect(callCount).toBe(1);
    });

    test('calls onchange when y is set', () => {
      let callCount = 0;
      const point = new Point(0, 0, () => callCount++);
      
      point.y = 10;
      expect(callCount).toBe(1);
    });

    test('calls onchange for each change', () => {
      let callCount = 0;
      const point = new Point(0, 0, () => callCount++);
      
      point.x = 10;
      point.y = 20;
      point.x = 30;
      
      expect(callCount).toBe(3);
    });

    test('does not call onchange if not provided', () => {
      const point = new Point(0, 0);
      // Should not throw
      point.x = 10;
      point.y = 20;
      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
    });
  });
});
