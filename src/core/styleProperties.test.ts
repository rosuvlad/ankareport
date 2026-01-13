import StyleProperties from './styleProperties';

describe('StyleProperties', () => {
  describe('constructor', () => {
    test('creates empty instance without default values', () => {
      const styles = new StyleProperties();
      
      expect(styles.color).toBeUndefined();
      expect(styles.backgroundColor).toBeUndefined();
      expect(styles.fontFamily).toBeUndefined();
      expect(styles.fontSize).toBeUndefined();
      expect(styles.fontWeight).toBeUndefined();
      expect(styles.textAlign).toBeUndefined();
      expect(styles.borderWidth).toBeUndefined();
      expect(styles.borderStyle).toBeUndefined();
      expect(styles.borderColor).toBeUndefined();
    });

    test('initializes with default values', () => {
      const styles = new StyleProperties({
        color: '#FF0000',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Arial',
        fontSize: '14px',
        fontWeight: 'bold',
        textAlign: 'center',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#000000',
      });
      
      expect(styles.color).toBe('#FF0000');
      expect(styles.backgroundColor).toBe('#FFFFFF');
      expect(styles.fontFamily).toBe('Arial');
      expect(styles.fontSize).toBe('14px');
      expect(styles.fontWeight).toBe('bold');
      expect(styles.textAlign).toBe('center');
      expect(styles.borderWidth).toBe(1);
      expect(styles.borderStyle).toBe('solid');
      expect(styles.borderColor).toBe('#000000');
    });

    test('initializes with partial default values', () => {
      const styles = new StyleProperties({
        color: '#FF0000',
        fontSize: '12px',
      });
      
      expect(styles.color).toBe('#FF0000');
      expect(styles.fontSize).toBe('12px');
      expect(styles.backgroundColor).toBeUndefined();
      expect(styles.fontFamily).toBeUndefined();
    });
  });

  describe('setters', () => {
    test('updates color property', () => {
      const styles = new StyleProperties();
      styles.color = '#00FF00';
      expect(styles.color).toBe('#00FF00');
    });

    test('updates backgroundColor property', () => {
      const styles = new StyleProperties();
      styles.backgroundColor = '#EEEEEE';
      expect(styles.backgroundColor).toBe('#EEEEEE');
    });

    test('updates textAlign property', () => {
      const styles = new StyleProperties();
      styles.textAlign = 'right';
      expect(styles.textAlign).toBe('right');
    });

    test('updates font properties', () => {
      const styles = new StyleProperties();
      styles.fontFamily = 'Times New Roman';
      styles.fontSize = '16px';
      styles.fontWeight = '700';
      
      expect(styles.fontFamily).toBe('Times New Roman');
      expect(styles.fontSize).toBe('16px');
      expect(styles.fontWeight).toBe('700');
    });

    test('updates border properties', () => {
      const styles = new StyleProperties();
      styles.borderWidth = 2;
      styles.borderStyle = 'dashed';
      styles.borderColor = '#333333';
      
      expect(styles.borderWidth).toBe(2);
      expect(styles.borderStyle).toBe('dashed');
      expect(styles.borderColor).toBe('#333333');
    });
  });

  describe('change events', () => {
    test('emits change event when property is set', () => {
      const styles = new StyleProperties();
      const events: any[] = [];
      
      styles.addEventListener('change', (args) => {
        events.push(args);
      });
      
      styles.color = '#FF0000';
      
      expect(events.length).toBe(1);
      expect(events[0].changes[0].property).toBe('color');
      expect(events[0].changes[0].newValue).toBe('#FF0000');
      expect(events[0].changes[0].oldValue).toBeUndefined();
    });

    test('emits change event with old and new values', () => {
      const styles = new StyleProperties({ color: '#000000' });
      const events: any[] = [];
      
      styles.addEventListener('change', (args) => {
        events.push(args);
      });
      
      styles.color = '#FF0000';
      
      expect(events.length).toBe(1);
      expect(events[0].changes[0].oldValue).toBe('#000000');
      expect(events[0].changes[0].newValue).toBe('#FF0000');
    });

    test('batches changes during update block', () => {
      const styles = new StyleProperties();
      const events: any[] = [];
      
      styles.addEventListener('change', (args) => {
        events.push(args);
      });
      
      styles.beginUpdate();
      styles.color = '#FF0000';
      styles.fontSize = '14px';
      styles.fontWeight = 'bold';
      styles.endUpdate();
      
      // Changes should be batched into single event
      expect(events.length).toBe(1);
      expect(events[0].changes.length).toBe(3);
    });
  });

  describe('getPropertyDefinitions', () => {
    test('returns all style property definitions', () => {
      const styles = new StyleProperties();
      const definitions = styles.getPropertyDefinitions();
      
      expect(definitions.length).toBe(9);
      
      const fields = definitions.map(d => d.field);
      expect(fields).toContain('color');
      expect(fields).toContain('backgroundColor');
      expect(fields).toContain('textAlign');
      expect(fields).toContain('borderWidth');
      expect(fields).toContain('borderStyle');
      expect(fields).toContain('borderColor');
      expect(fields).toContain('fontFamily');
      expect(fields).toContain('fontSize');
      expect(fields).toContain('fontWeight');
    });

    test('property definitions have correct labels', () => {
      const styles = new StyleProperties();
      const definitions = styles.getPropertyDefinitions();
      
      const colorDef = definitions.find(d => d.field === 'color');
      const bgDef = definitions.find(d => d.field === 'backgroundColor');
      
      expect(colorDef?.label).toBe('Color');
      expect(bgDef?.label).toBe('Background Color');
    });
  });
});
