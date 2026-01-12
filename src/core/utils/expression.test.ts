
import { evaluateExpression, ExpressionContext } from './expression';

describe('Expression Evaluator (jexpr refactor)', () => {
  const context: ExpressionContext = {
    data: {
      revenue: 5000,
      expenses: 3000,
      items: [
        { name: 'Item 1', val: 10, price: 5 },
        { name: 'Item 2', val: 20, price: 15 }
      ],
      company: { name: 'Acme', founded: '2000-01-01' },
      context: {
        localization: {
          localeCode: 'en-US',
          resources: {
            'en-US': { 'welcome': 'Welcome User' }
          }
        }
      }
    },
    rootData: {}
  };
  context.rootData = context.data;

  test('Arithmetic operations', () => {
    expect(evaluateExpression('1 + 2', context)).toBe(3);
    expect(evaluateExpression('10 - 4 * 2', context)).toBe(2);
    expect(evaluateExpression('(10 - 4) * 2', context)).toBe(12);
  });

  test('Property access', () => {
    expect(evaluateExpression('company.name', context)).toBe('Acme');
    expect(evaluateExpression('items[0].val', context)).toBe(10);
    expect(evaluateExpression('revenue', context)).toBe(5000);
  });

  test('Lambda expressions (Map)', () => {
    expect(evaluateExpression('items.map(x => x.val)', context)).toEqual([10, 20]);
    expect(evaluateExpression('items.map(i => i.price)', context)).toEqual([5, 15]);
  });

  test('Lambda expressions (Filter)', () => {
    const result = evaluateExpression('items.filter(x => x.val > 15)', context);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Item 2');
    expect(evaluateExpression('items.filter(x => x.val > 50).length', context)).toBe(0);
  });

  test('Aggregate functions with Lambdas', () => {
    expect(evaluateExpression('sum(items.map(x => x.val))', context)).toBe(30);
    expect(evaluateExpression('avg(items.map(x => x.val))', context)).toBe(15);
    expect(evaluateExpression('max(items.map(x => x.val))', context)).toBe(20);
  });

  test('Localize helper', () => {
    expect(evaluateExpression("localize('welcome')", context)).toBe('Welcome User');
    expect(evaluateExpression("localize('unknown', 'Default')", context)).toBe('Default');
  });

  test('Legacy Filters', () => {
    expect(evaluateExpression("' HELLO ' | lowercase | trim", context)).toBe('hello');
    expect(evaluateExpression("5000 | currency", context)).toBe('$5,000.00'); // Assuming en-US default
  });

  test('Comparison operators', () => {
    expect(evaluateExpression('revenue > expenses', context)).toBe(true);
    expect(evaluateExpression('revenue < 100', context)).toBe(false);
    expect(evaluateExpression('company.name == "Acme"', context)).toBe(true);
  });

  test('Ternary operator', () => {
    expect(evaluateExpression('revenue > 4000 ? "High" : "Low"', context)).toBe("High");
  });
});
