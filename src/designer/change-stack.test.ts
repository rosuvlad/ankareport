import { ChangeStack } from './change-stack';
import Properties, { PropertyChangeEventArgs } from '../core/properties';
import { Property } from '../components/propertyGrid/property';

// Mock Properties class for testing
class MockProperties extends Properties {
  private _value: any;
  private _name: string = '';

  get value() { return this._value; }
  set value(v: any) {
    const old = this._value;
    this._value = v;
    this.emitOnChange('value', v, old);
  }

  get name() { return this._name; }
  set name(v: string) {
    const old = this._name;
    this._name = v;
    this.emitOnChange('name', v, old);
  }

  getPropertyDefinitions(): Property[] {
    return [];
  }
}

// Mock objects for change events
function createMockChangeEvent(type: 'change-item', properties: Properties, changes: PropertyChangeEventArgs[]): any {
  return {
    type,
    item: { properties },
    changes,
  };
}

describe('ChangeStack', () => {
  describe('initial state', () => {
    test('canUndo is false initially', () => {
      const stack = new ChangeStack();
      expect(stack.canUndo).toBe(false);
    });

    test('canRedo is false initially', () => {
      const stack = new ChangeStack();
      expect(stack.canRedo).toBe(false);
    });
  });

  describe('add', () => {
    test('adds change to stack', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canUndo).toBe(true);
    });

    test('canUndo becomes true after adding', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      expect(stack.canUndo).toBe(false);
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canUndo).toBe(true);
    });

    test('does not add when locked', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.lock();
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canUndo).toBe(false);
    });

    test('adds after unlock', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.lock();
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      expect(stack.canUndo).toBe(false);
      
      stack.unlock();
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 2, newValue: 3 }
      ]));
      expect(stack.canUndo).toBe(true);
    });
  });

  describe('undo', () => {
    test('reverts property to old value', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      props.value = 10;
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 5, newValue: 10 }
      ]));
      
      stack.undo();
      
      expect(props.value).toBe(5);
    });

    test('canUndo becomes false after undoing single change', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canUndo).toBe(true);
      stack.undo();
      expect(stack.canUndo).toBe(false);
    });

    test('canRedo becomes true after undo', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canRedo).toBe(false);
      stack.undo();
      expect(stack.canRedo).toBe(true);
    });

    test('does nothing when canUndo is false', () => {
      const stack = new ChangeStack();
      // Should not throw
      stack.undo();
      expect(stack.canUndo).toBe(false);
    });

    test('undoes multiple property changes', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      props.value = 20;
      props.name = 'test';
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 10, newValue: 20 },
        { property: 'name', oldValue: 'original', newValue: 'test' }
      ]));
      
      stack.undo();
      
      expect(props.value).toBe(10);
      expect(props.name).toBe('original');
    });
  });

  describe('redo', () => {
    test('reapplies property change', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      props.value = 10;
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 5, newValue: 10 }
      ]));
      
      stack.undo();
      expect(props.value).toBe(5);
      
      stack.redo();
      expect(props.value).toBe(10);
    });

    test('canRedo becomes false after redo', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      stack.undo();
      expect(stack.canRedo).toBe(true);
      
      stack.redo();
      expect(stack.canRedo).toBe(false);
    });

    test('canUndo becomes true after redo', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      stack.undo();
      expect(stack.canUndo).toBe(false);
      
      stack.redo();
      expect(stack.canUndo).toBe(true);
    });

    test('does nothing when canRedo is false', () => {
      const stack = new ChangeStack();
      // Should not throw
      stack.redo();
      expect(stack.canRedo).toBe(false);
    });
  });

  describe('undo/redo sequence', () => {
    test('multiple undo then redo', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      // Initial state
      props.value = 1;
      
      // Change 1: 1 -> 2
      props.value = 2;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      // Change 2: 2 -> 3
      props.value = 3;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 2, newValue: 3 }
      ]));
      
      // Change 3: 3 -> 4
      props.value = 4;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 3, newValue: 4 }
      ]));
      
      expect(props.value).toBe(4);
      
      // Undo to 3
      stack.undo();
      expect(props.value).toBe(3);
      
      // Undo to 2
      stack.undo();
      expect(props.value).toBe(2);
      
      // Redo to 3
      stack.redo();
      expect(props.value).toBe(3);
      
      // Redo to 4
      stack.redo();
      expect(props.value).toBe(4);
    });

    test('new change after undo clears redo stack', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      props.value = 1;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 0, newValue: 1 }
      ]));
      
      props.value = 2;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      // Undo to 1
      stack.undo();
      expect(props.value).toBe(1);
      expect(stack.canRedo).toBe(true);
      
      // New change - should clear redo
      props.value = 5;
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 5 }
      ]));
      
      expect(stack.canRedo).toBe(false);
    });
  });

  describe('lock/unlock', () => {
    test('lock prevents adding changes', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.lock();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 2, newValue: 3 }
      ]));
      
      expect(stack.canUndo).toBe(false);
    });

    test('unlock allows adding changes again', () => {
      const stack = new ChangeStack();
      const props = new MockProperties();
      
      stack.lock();
      stack.unlock();
      
      stack.add(createMockChangeEvent('change-item', props, [
        { property: 'value', oldValue: 1, newValue: 2 }
      ]));
      
      expect(stack.canUndo).toBe(true);
    });
  });
});
