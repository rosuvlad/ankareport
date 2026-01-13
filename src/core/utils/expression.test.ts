
import { evaluateExpression, ExpressionContext, resolveJsonPath } from './expression';

// =============================================================================
// EXPRESSION EVALUATOR TESTS
// =============================================================================

describe('Expression Evaluator - Basic Operations', () => {
  const context: ExpressionContext = {
    data: {
      revenue: 5000,
      expenses: 3000,
      profit: 2000,
      taxRate: 0.25,
      company: { name: 'Acme Corp', founded: '2000-01-01' },
    },
    rootData: {},
  };
  context.rootData = context.data;

  test('Arithmetic operations', () => {
    expect(evaluateExpression('1 + 2', context)).toBe(3);
    expect(evaluateExpression('10 - 4 * 2', context)).toBe(2);
    expect(evaluateExpression('(10 - 4) * 2', context)).toBe(12);
    expect(evaluateExpression('100 / 4', context)).toBe(25);
    expect(evaluateExpression('17 % 5', context)).toBe(2);
  });

  test('Property access (jexpr scope)', () => {
    expect(evaluateExpression('company.name', context)).toBe('Acme Corp');
    expect(evaluateExpression('revenue', context)).toBe(5000);
    expect(evaluateExpression('revenue - expenses', context)).toBe(2000);
    expect(evaluateExpression('profit * taxRate', context)).toBe(500);
  });

  test('Comparison operators', () => {
    expect(evaluateExpression('revenue > expenses', context)).toBe(true);
    expect(evaluateExpression('revenue < 100', context)).toBe(false);
    expect(evaluateExpression('revenue >= 5000', context)).toBe(true);
    expect(evaluateExpression('expenses <= 3000', context)).toBe(true);
    expect(evaluateExpression('company.name == "Acme Corp"', context)).toBe(true);
    expect(evaluateExpression('company.name != "Other"', context)).toBe(true);
  });

  test('Logical operators', () => {
    expect(evaluateExpression('revenue > 1000 && expenses < 5000', context)).toBe(true);
    expect(evaluateExpression('revenue < 1000 || expenses < 5000', context)).toBe(true);
    expect(evaluateExpression('!(revenue < 1000)', context)).toBe(true);
  });

  test('Ternary operator', () => {
    expect(evaluateExpression('revenue > 4000 ? "High" : "Low"', context)).toBe("High");
    expect(evaluateExpression('revenue < 1000 ? "Low" : "High"', context)).toBe("High");
    expect(evaluateExpression('profit > 0 ? profit : 0', context)).toBe(2000);
  });

  test('String concatenation', () => {
    expect(evaluateExpression('"Hello " + "World"', context)).toBe("Hello World");
    expect(evaluateExpression('company.name + " Inc"', context)).toBe("Acme Corp Inc");
  });

  test('Nullish coalescing', () => {
    expect(evaluateExpression('nonexistent ?? "default"', context)).toBe("default");
    expect(evaluateExpression('revenue ?? 0', context)).toBe(5000);
  });
});

describe('Expression Evaluator - Arrays and Lambdas', () => {
  const context: ExpressionContext = {
    data: {
      items: [
        { name: 'Item 1', val: 10, price: 5, category: 'A' },
        { name: 'Item 2', val: 20, price: 15, category: 'B' },
        { name: 'Item 3', val: 30, price: 25, category: 'A' },
      ],
      numbers: [1, 2, 3, 4, 5],
    },
    rootData: {},
  };
  context.rootData = context.data;

  test('Array access', () => {
    expect(evaluateExpression('items[0].name', context)).toBe('Item 1');
    expect(evaluateExpression('items[1].val', context)).toBe(20);
    expect(evaluateExpression('numbers[2]', context)).toBe(3);
    expect(evaluateExpression('items.length', context)).toBe(3);
  });

  test('Lambda expressions - map', () => {
    expect(evaluateExpression('items.map(x => x.val)', context)).toEqual([10, 20, 30]);
    expect(evaluateExpression('items.map(i => i.price)', context)).toEqual([5, 15, 25]);
    expect(evaluateExpression('numbers.map(n => n * 2)', context)).toEqual([2, 4, 6, 8, 10]);
  });

  test('Lambda expressions - filter', () => {
    const result = evaluateExpression('items.filter(x => x.val > 15)', context);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Item 2');
    expect(result[1].name).toBe('Item 3');
    
    expect(evaluateExpression('items.filter(x => x.category == "A").length', context)).toBe(2);
    expect(evaluateExpression('numbers.filter(n => n > 3)', context)).toEqual([4, 5]);
  });

  test('Lambda expressions - find', () => {
    const result = evaluateExpression('items.find(x => x.val == 20)', context);
    expect(result.name).toBe('Item 2');
  });

  test('Lambda expressions - reduce', () => {
    expect(evaluateExpression('numbers.reduce((a, b) => a + b, 0)', context)).toBe(15);
  });

  test('Chained array operations', () => {
    expect(evaluateExpression('items.filter(x => x.category == "A").map(x => x.val)', context)).toEqual([10, 30]);
    expect(evaluateExpression('items.map(x => x.price).filter(p => p > 10)', context)).toEqual([15, 25]);
  });
});

describe('Expression Evaluator - Aggregate Functions', () => {
  const context: ExpressionContext = {
    data: {
      items: [
        { name: 'Item 1', amount: 100 },
        { name: 'Item 2', amount: 200 },
        { name: 'Item 3', amount: 300 },
      ],
      numbers: [10, 20, 30, 40, 50],
    },
    rootData: {},
  };
  context.rootData = context.data;

  test('sum function', () => {
    expect(evaluateExpression('sum(items.map(x => x.amount))', context)).toBe(600);
    expect(evaluateExpression('sum(numbers)', context)).toBe(150);
  });

  test('avg function', () => {
    expect(evaluateExpression('avg(items.map(x => x.amount))', context)).toBe(200);
    expect(evaluateExpression('avg(numbers)', context)).toBe(30);
  });

  test('min function', () => {
    expect(evaluateExpression('min(items.map(x => x.amount))', context)).toBe(100);
    expect(evaluateExpression('min(numbers)', context)).toBe(10);
  });

  test('max function', () => {
    expect(evaluateExpression('max(items.map(x => x.amount))', context)).toBe(300);
    expect(evaluateExpression('max(numbers)', context)).toBe(50);
  });

  test('count function', () => {
    expect(evaluateExpression('count(items)', context)).toBe(3);
    expect(evaluateExpression('count(numbers)', context)).toBe(5);
  });
});

describe('Expression Evaluator - Context Variables ($)', () => {
  test('$index and $rowNum', () => {
    const context: ExpressionContext = {
      data: { name: 'Test' },
      rootData: { name: 'Test' },
      index: 5,
    };
    
    expect(evaluateExpression('$index', context)).toBe(5);
    expect(evaluateExpression('$rowNum', context)).toBe(6);
    expect(evaluateExpression('$index + 1', context)).toBe(6);
    expect(evaluateExpression('"Row " + $rowNum', context)).toBe("Row 6");
  });

  test('$pageNum and $totalPages', () => {
    const context: ExpressionContext = {
      data: {},
      rootData: {},
      pageNum: 3,
      totalPages: 10,
    };
    
    expect(evaluateExpression('$pageNum', context)).toBe(3);
    expect(evaluateExpression('$totalPages', context)).toBe(10);
    expect(evaluateExpression('"Page " + $pageNum + " of " + $totalPages', context)).toBe("Page 3 of 10");
  });

  test('$groupKey and $groupCount', () => {
    const context: ExpressionContext = {
      data: {},
      rootData: {},
      groupKey: 'Category A',
      groupCount: 5,
      groupData: [
        { amount: 100 },
        { amount: 200 },
        { amount: 300 },
        { amount: 400 },
        { amount: 500 },
      ],
    };
    
    expect(evaluateExpression('$groupKey', context)).toBe('Category A');
    expect(evaluateExpression('$groupCount', context)).toBe(5);
    expect(evaluateExpression('"Group: " + $groupKey + " (" + $groupCount + " items)"', context)).toBe("Group: Category A (5 items)");
  });

  test('$sum_field, $avg_field, $min_field, $max_field (group aggregates)', () => {
    const context: ExpressionContext = {
      data: {},
      rootData: {},
      groupData: [
        { amount: 100, qty: 2 },
        { amount: 200, qty: 3 },
        { amount: 300, qty: 5 },
      ],
    };
    
    expect(evaluateExpression('$sum_amount', context)).toBe(600);
    expect(evaluateExpression('$avg_amount', context)).toBe(200);
    expect(evaluateExpression('$min_amount', context)).toBe(100);
    expect(evaluateExpression('$max_amount', context)).toBe(300);
    expect(evaluateExpression('$sum_qty', context)).toBe(10);
  });

  test('Temporal variables', () => {
    const context: ExpressionContext = {
      data: {},
      rootData: {},
    };
    
    // These should return valid date strings (actual values depend on current time)
    const nowUtc = evaluateExpression('$nowUtc', context);
    const nowLocal = evaluateExpression('$nowLocal', context);
    const timeZoneId = evaluateExpression('$timeZoneId', context);
    const utcOffset = evaluateExpression('$utcOffsetMinutes', context);
    
    expect(typeof nowUtc).toBe('string');
    expect(nowUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    expect(typeof nowLocal).toBe('string');
    expect(typeof timeZoneId).toBe('string');
    expect(typeof utcOffset).toBe('number');
  });
});

describe('Expression Evaluator - var() JSONPath Function', () => {
  const context: ExpressionContext = {
    data: {
      store: {
        name: 'My Store',
        books: [
          { title: 'Book 1', price: 10, category: 'fiction' },
          { title: 'Book 2', price: 20, category: 'non-fiction' },
          { title: 'Book 3', price: 15, category: 'fiction' },
        ],
      },
      context: {
        localization: {
          localeCode: 'en-US',
          resources: {
            'en-US': { 'greeting': 'Hello' },
            'es-ES': { 'greeting': 'Hola' },
          },
        },
      },
    },
    rootData: {},
  };
  context.rootData = context.data;

  test('var() with simple path', () => {
    expect(evaluateExpression("var('$.store.name')", context)).toBe('My Store');
  });

  test('var() with array index', () => {
    expect(evaluateExpression("var('$.store.books[0].title')", context)).toBe('Book 1');
    expect(evaluateExpression("var('$.store.books[1].price')", context)).toBe(20);
  });

  test('var() with array wildcard', () => {
    expect(evaluateExpression("var('$.store.books[*].title')", context)).toEqual(['Book 1', 'Book 2', 'Book 3']);
    expect(evaluateExpression("var('$.store.books[*].price')", context)).toEqual([10, 20, 15]);
  });

  test('var() with filter expression', () => {
    const result = evaluateExpression("var('$.store.books[?(@.price > 12)]')", context);
    expect(result).toHaveLength(2);
  });

  test('var() with recursive descent', () => {
    expect(evaluateExpression("var('$..price')", context)).toEqual([10, 20, 15]);
  });

  test('var() for localization context', () => {
    expect(evaluateExpression("var('$.context.localization.localeCode')", context)).toBe('en-US');
  });

  test('var() combined with other expressions', () => {
    expect(evaluateExpression("var('$.store.name') + ' - Open'", context)).toBe('My Store - Open');
    expect(evaluateExpression("sum(var('$.store.books[*].price'))", context)).toBe(45);
  });
});

describe('Expression Evaluator - Localization', () => {
  const context: ExpressionContext = {
    data: {
      context: {
        localization: {
          localeCode: 'en-US',
          resources: {
            'en-US': { 
              'welcome': 'Welcome User',
              'greeting': 'Hello',
              'farewell': 'Goodbye',
            },
            'es-ES': {
              'welcome': 'Bienvenido Usuario',
              'greeting': 'Hola',
              'farewell': 'Adiós',
            },
          },
        },
      },
    },
    rootData: {},
  };
  context.rootData = context.data;

  test('localize with key', () => {
    expect(evaluateExpression("localize('welcome')", context)).toBe('Welcome User');
    expect(evaluateExpression("localize('greeting')", context)).toBe('Hello');
  });

  test('localize with default fallback', () => {
    expect(evaluateExpression("localize('unknown', 'Default Text')", context)).toBe('Default Text');
    expect(evaluateExpression("localize('missing_key', 'Fallback')", context)).toBe('Fallback');
  });

  test('localize with explicit locale', () => {
    expect(evaluateExpression("localize('greeting', 'Hi', 'es-ES')", context)).toBe('Hola');
    expect(evaluateExpression("localize('farewell', 'Bye', 'es-ES')", context)).toBe('Adiós');
  });
});

describe('Expression Evaluator - Filters (Pipe Syntax)', () => {
  const context: ExpressionContext = {
    data: {},
    rootData: {},
  };

  test('String filters', () => {
    expect(evaluateExpression("'hello world' | uppercase", context)).toBe('HELLO WORLD');
    expect(evaluateExpression("'HELLO WORLD' | lowercase", context)).toBe('hello world');
    expect(evaluateExpression("'hello world' | capitalize", context)).toBe('Hello World');
    expect(evaluateExpression("'  hello  ' | trim", context)).toBe('hello');
  });

  test('Number filters', () => {
    expect(evaluateExpression("1234.567 | number:2", context)).toBe('1234.57');
    expect(evaluateExpression("0.25 | percent:1", context)).toBe('25.0%');
    expect(evaluateExpression("-42 | abs", context)).toBe(42);
    expect(evaluateExpression("3.7 | round", context)).toBe(4);
    expect(evaluateExpression("3.7 | floor", context)).toBe(3);
    expect(evaluateExpression("3.2 | ceil", context)).toBe(4);
  });

  test('Currency filter', () => {
    expect(evaluateExpression("5000 | currency", context)).toBe('$5,000.00');
    expect(evaluateExpression("1234.56 | currency:EUR:de-DE", context)).toMatch(/1\.234,56/);
  });

  test('String manipulation filters', () => {
    expect(evaluateExpression("'Hello World' | truncate:5:...", context)).toBe('Hello...');
    expect(evaluateExpression("'42' | padstart:5:0", context)).toBe('00042');
    expect(evaluateExpression("'42' | padend:5:0", context)).toBe('42000');
    expect(evaluateExpression("'hello-world' | replace:-:_", context)).toBe('hello_world');
    expect(evaluateExpression("'Hello World' | slice:0:5", context)).toBe('Hello');
  });

  test('Default filter', () => {
    expect(evaluateExpression("null | default:N/A", context)).toBe('N/A');
    expect(evaluateExpression("'' | default:Empty", context)).toBe('Empty');
  });

  test('Chained filters', () => {
    expect(evaluateExpression("' HELLO ' | lowercase | trim", context)).toBe('hello');
    expect(evaluateExpression("'hello world' | uppercase | slice:0:5", context)).toBe('HELLO');
  });
});

// =============================================================================
// JSONPATH RESOLVER TESTS
// =============================================================================

describe('resolveJsonPath - Basic Operations', () => {
  const data = {
    store: {
      name: 'Book Store',
      books: [
        { title: 'Book A', price: 10, author: 'Author 1' },
        { title: 'Book B', price: 20, author: 'Author 2' },
        { title: 'Book C', price: 15, author: 'Author 1' },
      ],
      location: {
        city: 'New York',
        country: 'USA',
      },
    },
    users: [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ],
  };

  test('Root property access', () => {
    expect(resolveJsonPath('$.store', data)).toEqual(data.store);
  });

  test('Nested property access', () => {
    expect(resolveJsonPath('$.store.name', data)).toBe('Book Store');
    expect(resolveJsonPath('$.store.location.city', data)).toBe('New York');
  });

  test('Array index access', () => {
    expect(resolveJsonPath('$.store.books[0].title', data)).toBe('Book A');
    expect(resolveJsonPath('$.store.books[1].price', data)).toBe(20);
    expect(resolveJsonPath('$.users[0].name', data)).toBe('John');
  });

  test('Array wildcard [*]', () => {
    expect(resolveJsonPath('$.store.books[*].title', data)).toEqual(['Book A', 'Book B', 'Book C']);
    expect(resolveJsonPath('$.store.books[*].price', data)).toEqual([10, 20, 15]);
    expect(resolveJsonPath('$.users[*].name', data)).toEqual(['John', 'Jane']);
  });

  test('Recursive descent (..)', () => {
    expect(resolveJsonPath('$..title', data)).toEqual(['Book A', 'Book B', 'Book C']);
    expect(resolveJsonPath('$..name', data)).toEqual(['Book Store', 'John', 'Jane']);
  });

  test('Filter expressions [?()]', () => {
    const expensiveBooks = resolveJsonPath('$.store.books[?(@.price > 12)]', data);
    expect(expensiveBooks).toHaveLength(2);
    
    const author1Books = resolveJsonPath('$.store.books[?(@.author == "Author 1")]', data);
    expect(author1Books).toHaveLength(2);
  });

  test('Returns null for non-existent paths', () => {
    expect(resolveJsonPath('$.nonexistent', data)).toBeNull();
    expect(resolveJsonPath('$.store.nonexistent', data)).toBeNull();
    expect(resolveJsonPath('$.store.books[99]', data)).toBeNull();
  });

  test('Handles null/undefined data', () => {
    expect(resolveJsonPath('$.anything', null)).toBeNull();
    expect(resolveJsonPath('$.anything', undefined)).toBeNull();
  });

  test('Handles empty path', () => {
    expect(resolveJsonPath('', data)).toBeNull();
  });
});
