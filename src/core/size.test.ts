import Size from './size';

describe('Size', () => {
  describe('constructor', () => {
    test('creates size with default values (0, 0)', () => {
      const size = new Size();
      expect(size.width).toBe(0);
      expect(size.height).toBe(0);
    });

    test('creates size with specified width', () => {
      const size = new Size(100);
      expect(size.width).toBe(100);
      expect(size.height).toBe(0);
    });

    test('creates size with specified width and height', () => {
      const size = new Size(100, 200);
      expect(size.width).toBe(100);
      expect(size.height).toBe(200);
    });

    test('handles zero values correctly', () => {
      const size = new Size(0, 0);
      expect(size.width).toBe(0);
      expect(size.height).toBe(0);
    });
  });

  describe('setters', () => {
    test('updates width value', () => {
      const size = new Size(0, 0);
      size.width = 150;
      expect(size.width).toBe(150);
    });

    test('updates height value', () => {
      const size = new Size(0, 0);
      size.height = 250;
      expect(size.height).toBe(250);
    });

    test('updates both values independently', () => {
      const size = new Size(100, 200);
      size.width = 300;
      expect(size.width).toBe(300);
      expect(size.height).toBe(200);
      
      size.height = 400;
      expect(size.width).toBe(300);
      expect(size.height).toBe(400);
    });
  });

  describe('onchange callback', () => {
    test('calls onchange when width is set', () => {
      let callCount = 0;
      const size = new Size(0, 0, () => callCount++);
      
      size.width = 100;
      expect(callCount).toBe(1);
    });

    test('calls onchange when height is set', () => {
      let callCount = 0;
      const size = new Size(0, 0, () => callCount++);
      
      size.height = 100;
      expect(callCount).toBe(1);
    });

    test('calls onchange for each change', () => {
      let callCount = 0;
      const size = new Size(0, 0, () => callCount++);
      
      size.width = 100;
      size.height = 200;
      size.width = 300;
      
      expect(callCount).toBe(3);
    });

    test('does not call onchange if not provided', () => {
      const size = new Size(0, 0);
      // Should not throw
      size.width = 100;
      size.height = 200;
      expect(size.width).toBe(100);
      expect(size.height).toBe(200);
    });
  });
});
