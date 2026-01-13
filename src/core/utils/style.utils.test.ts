import StyleProperties from '../styleProperties';
import { isValidStyle, MultipleStyles } from './style.utils';

describe('isValidStyle', () => {
  test('returns false for undefined', () => {
    expect(isValidStyle(undefined)).toBe(false);
  });

  test('returns false for null', () => {
    expect(isValidStyle(null)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidStyle('')).toBe(false);
  });

  test('returns true for non-empty string', () => {
    expect(isValidStyle('#FF0000')).toBe(true);
    expect(isValidStyle('Arial')).toBe(true);
    expect(isValidStyle('14px')).toBe(true);
  });

  test('returns true for numbers', () => {
    expect(isValidStyle(0)).toBe(true);
    expect(isValidStyle(1)).toBe(true);
    expect(isValidStyle(100)).toBe(true);
  });

  test('returns true for boolean', () => {
    expect(isValidStyle(true)).toBe(true);
    expect(isValidStyle(false)).toBe(true);
  });
});

describe('MultipleStyles', () => {
  describe('constructor', () => {
    test('creates empty instance', () => {
      const multi = new MultipleStyles();
      expect(multi.getList()).toEqual([]);
    });

    test('creates instance with initial styles', () => {
      const style1 = new StyleProperties({ color: '#FF0000' });
      const style2 = new StyleProperties({ fontSize: '14px' });
      
      const multi = new MultipleStyles(style1, style2);
      expect(multi.getList().length).toBe(2);
    });
  });

  describe('join', () => {
    test('adds style to list', () => {
      const multi = new MultipleStyles();
      const style = new StyleProperties({ color: '#FF0000' });
      
      multi.join(style);
      expect(multi.getList().length).toBe(1);
    });

    test('adds multiple styles', () => {
      const multi = new MultipleStyles();
      
      multi.join(new StyleProperties({ color: '#FF0000' }));
      multi.join(new StyleProperties({ fontSize: '14px' }));
      multi.join(new StyleProperties({ fontWeight: 'bold' }));
      
      expect(multi.getList().length).toBe(3);
    });
  });

  describe('getStyle', () => {
    test('returns default value when no styles have the property', () => {
      const multi = new MultipleStyles();
      
      const result = multi.getStyle('color', '#000000');
      expect(result).toBe('#000000');
    });

    test('returns value from single style', () => {
      const style = new StyleProperties({ color: '#FF0000' });
      const multi = new MultipleStyles(style);
      
      const result = multi.getStyle('color', '#000000');
      expect(result).toBe('#FF0000');
    });

    test('returns value from last style with property (cascade)', () => {
      const style1 = new StyleProperties({ color: '#FF0000' });
      const style2 = new StyleProperties({ color: '#00FF00' });
      const style3 = new StyleProperties({ color: '#0000FF' });
      
      const multi = new MultipleStyles(style1, style2, style3);
      
      const result = multi.getStyle('color', '#000000');
      expect(result).toBe('#0000FF'); // Last one wins
    });

    test('skips styles without the property', () => {
      const style1 = new StyleProperties({ color: '#FF0000' });
      const style2 = new StyleProperties({ fontSize: '14px' }); // No color
      const style3 = new StyleProperties({ fontWeight: 'bold' }); // No color
      
      const multi = new MultipleStyles(style1, style2, style3);
      
      const result = multi.getStyle('color', '#000000');
      expect(result).toBe('#FF0000'); // First one with color
    });

    test('returns default when all styles have undefined property', () => {
      const style1 = new StyleProperties({ fontSize: '14px' });
      const style2 = new StyleProperties({ fontWeight: 'bold' });
      
      const multi = new MultipleStyles(style1, style2);
      
      const result = multi.getStyle('color', '#000000');
      expect(result).toBe('#000000');
    });

    test('handles different property types', () => {
      const style1 = new StyleProperties({
        color: '#FF0000',
        fontSize: '12px',
        borderWidth: 1,
        textAlign: 'left',
      });
      const style2 = new StyleProperties({
        fontSize: '14px',
        textAlign: 'center',
      });
      
      const multi = new MultipleStyles(style1, style2);
      
      expect(multi.getStyle('color', '#000000')).toBe('#FF0000');
      expect(multi.getStyle('fontSize', '10px')).toBe('14px');
      expect(multi.getStyle('borderWidth', 0)).toBe(1);
      expect(multi.getStyle('textAlign', 'left')).toBe('center');
    });

    test('style inheritance chain works correctly', () => {
      // Simulates: default -> section -> item styles
      const defaultStyle = new StyleProperties({
        color: '#000000',
        fontFamily: 'Arial',
        fontSize: '12px',
      });
      const sectionStyle = new StyleProperties({
        fontSize: '14px',
        fontWeight: 'bold',
      });
      const itemStyle = new StyleProperties({
        color: '#FF0000',
      });
      
      const multi = new MultipleStyles(defaultStyle, sectionStyle, itemStyle);
      
      // Item overrides color
      expect(multi.getStyle('color', '')).toBe('#FF0000');
      // Section overrides fontSize
      expect(multi.getStyle('fontSize', '')).toBe('14px');
      // Section adds fontWeight
      expect(multi.getStyle('fontWeight', '')).toBe('bold');
      // Default provides fontFamily
      expect(multi.getStyle('fontFamily', '')).toBe('Arial');
    });
  });
});
