export interface ExpressionContext {
  data: any;
  rootData?: any;
  index?: number;
  rowNum?: number;
  pageNum?: number;
  totalPages?: number;
  groupKey?: any;
  groupCount?: number;
  groupData?: any[];
}

export function evaluateExpression(expression: string, context: ExpressionContext): any {
  if (!expression) return null;

  // Preprocess: replace $index and $rowNum in the expression
  let preprocessed = expression;
  if (context.index !== undefined) {
    preprocessed = preprocessed.replace(/\$index/g, String(context.index));
    preprocessed = preprocessed.replace(/\$rowNum/g, String(context.index + 1));
  }

  // Preprocess: replace temporal context variables (only if expression contains them)
  if (preprocessed.includes('$now') || preprocessed.includes('$timeZone') || preprocessed.includes('$utcOffset')) {
    const temporal = context.rootData?.context?.temporal ?? context.data?.context?.temporal;
    if (temporal) {
      preprocessed = preprocessed.replace(/\$nowUtc/g, `"${temporal.nowUtc ?? ''}"`);
      preprocessed = preprocessed.replace(/\$timeZoneId/g, `"${temporal.timeZoneId ?? ''}"`);
      preprocessed = preprocessed.replace(/\$nowLocal/g, `"${temporal.nowLocal ?? ''}"`);
      preprocessed = preprocessed.replace(/\$utcOffsetMinutes/g, String(temporal.utcOffsetMinutes ?? 0));
    } else {
      // Auto-fill from JavaScript Date if context.temporal is missing
      const now = new Date();
      const utcOffsetMinutes = -now.getTimezoneOffset();
      preprocessed = preprocessed.replace(/\$nowUtc/g, `"${now.toISOString()}"`);
      preprocessed = preprocessed.replace(/\$timeZoneId/g, `"${Intl.DateTimeFormat().resolvedOptions().timeZone}"`);
      preprocessed = preprocessed.replace(/\$nowLocal/g, `"${now.toISOString().slice(0, -1)}${utcOffsetMinutes >= 0 ? '+' : '-'}${String(Math.abs(Math.floor(utcOffsetMinutes / 60))).padStart(2, '0')}:${String(Math.abs(utcOffsetMinutes % 60)).padStart(2, '0')}"`);
      preprocessed = preprocessed.replace(/\$utcOffsetMinutes/g, String(utcOffsetMinutes));
    }
  }

  // Handle pipes/filters first - split by | but not inside quotes or brackets
  const { expr, filters } = parseFilters(preprocessed);

  let result = evaluateCore(expr.trim(), context);

  // Apply filters
  for (const filter of filters) {
    result = applyFilter(result, filter.name, filter.args);
  }

  return result;
}


// Import jexpr from local vendored path
// @ts-ignore
import { parse, EvalAstFactory } from './jexpr/index.js';

const astFactory = new EvalAstFactory();

// Cache parsed ASTs for performance
const astCache = new Map<string, any>();

function getAst(expr: string) {
  if (astCache.has(expr)) return astCache.get(expr);
  try {
    const ast = parse(expr, astFactory);
    astCache.set(expr, ast);
    return ast;
  } catch (e) {
    // If jexpr fails, return null -> fallback might be needed or just fail
    // console.warn(`[JEXPR] Parse error for "${expr}":`, e);
    return null;
  }
}

function evaluateCore(expr: string, context: ExpressionContext): any {
  // 1. Try generic jexpr evaluation
  const ast = getAst(expr);
  if (ast) {
    try {
      // Construct a rich scope with data + helper functions
      const scope = createEvaluationScope(context);
      return ast.evaluate(scope);
    } catch (e) {
      console.warn(`[JEXPR] Eval error for "${expr}":`, e);
    }
  }

  // Fallback to old simple string/numeric handling if jexpr failed (e.g. specialized syntax not supported?)
  // Or simply return undefined.
  // Existing logic had a "fallback" to `new Function`. `jexpr` AST eval is safer equivalent.
  // But let's keep the simple literal handling just in case of overhead? No, jexpr handles literals fine.

  // Maybe handle array string "['a','b']" if jexpr didn't parse it? jexpr parsers [ ].

  return undefined;
}

function createEvaluationScope(context: ExpressionContext): any {
  const data = context.data || {};
  const rootData = context.rootData || data;

  // Create a proxy or merged object to expose:
  // 1. data properties (top level)
  // 2. rootData (as backup? or via special keyword?) -> resolvePath fallback uses rootData.
  // 3. Helper functions: SUM, AVG, COUNT, LOCALIZE, etc.

  // Helper functions need access to context too (for resolving paths inside them?)
  // But SUM(items.price) -> jexpr evaluates items.price -> passing array to SUM.
  // So SUM function just needs to handle array argument.

  const helpers = {
    sum: (arg: any) => aggregate('SUM', arg),
    avg: (arg: any) => aggregate('AVG', arg),
    count: (arg: any) => aggregate('COUNT', arg),
    min: (arg: any) => aggregate('MIN', arg),
    max: (arg: any) => aggregate('MAX', arg),
    localize: (key: any, defaultText?: any, locale?: any, resources?: any) =>
      evaluateLocalizeFn(key, defaultText, locale, resources, context),
    convertTz: (dt: any, to: any, from?: any) => evaluateConvertTzFn(dt, to, from),
    // Add context vars
    $index: context.index,
    $rowNum: context.rowNum,
    $groupKey: context.groupKey,
    $groupCount: context.groupCount,
  };

  // Merge order: Helpers > Data > RootData?
  // Or Data > Helpers? 
  // Usually Data first. But SUM is reserved.

  return new Proxy(data, {
    has(target, prop) {
      if (typeof prop === 'string' && prop.startsWith('$')) return true;
      return (prop in helpers) || (prop in target) || (rootData && prop in rootData);
    },
    get(target, prop) {
      if (typeof prop === 'string' && prop in helpers) return (helpers as any)[prop];

      if (typeof prop === 'string' && prop.startsWith('$')) {
        const groupAggMatch = prop.match(/^\$(sum|avg|min|max)_(.+)$/i);
        if (groupAggMatch && context.groupData) {
          const aggType = groupAggMatch[1].toUpperCase();
          const field = groupAggMatch[2];
          return calculateGroupAggregate(aggType, field, context.groupData);
        }
      }

      if (prop in target) return target[prop];
      if (rootData && prop in rootData) return rootData[prop];
      return undefined;
    }
  });
}

function aggregate(type: string, data: any): number {
  if (!Array.isArray(data)) return 0;
  // data is already an array of values (if resolved by jexpr `items.price`? No `items.price` on array returns undefined in JS)
  // Wait, `items.map(i=>i.price)` returns array.
  // So `SUM(items.map(i=>i.price))` works.
  // But user might write `SUM(items, 'price')`?
  // Old parser supported `SUM(items.price)`.
  // Does `jexpr` resolve `items.price` where items is array? `jexpr` acts like JS. `[].price` is undefined.
  // So `SUM(items.price)` will fail in JS/jexpr unless we add "projection via dot" logic to jexpr member access.
  // OPTION: Users must write `SUM(items.map(i=>i.price))`. 
  // OR we support `SUM(items, 'price')`.
  // Given we are refactoring, we can support the more standard `SUM(items.map(...))` or `SUM(items, 'prop')`.
  // Let's assume standard JS arrays.

  // Existing helper logic:
  const values = data.map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
  switch (type) {
    case 'SUM': return values.reduce((a, b) => a + b, 0);
    case 'AVG': return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'COUNT': return values.length;
    case 'MIN': return Math.min(...values);
    case 'MAX': return Math.max(...values);
  }
  return 0;
}


function evaluateSpecialVariable(expr: string, context: ExpressionContext): any {
  switch (expr) {
    case '$index':
      return context.index ?? 0;
    case '$rowNum':
      return (context.index ?? 0) + 1;
    case '$pageNum':
      return context.pageNum ?? 1;
    case '$totalPages':
      return context.totalPages ?? 1;
    case '$groupKey':
      return context.groupKey ?? '';
    case '$groupCount':
      return context.groupCount ?? 0;
    case '$first':
      return context.groupData?.[0] ?? null;
    case '$last':
      return context.groupData?.[context.groupData?.length - 1] ?? null;
  }

  // Handle $sum_field, $avg_field, etc.
  const groupAggMatch = expr.match(/^\$(sum|avg|min|max)_(.+)$/i);
  if (groupAggMatch && context.groupData) {
    const aggType = groupAggMatch[1].toUpperCase();
    const field = groupAggMatch[2];
    return calculateGroupAggregate(aggType, field, context.groupData);
  }

  return undefined;
}

function calculateGroupAggregate(type: string, field: string, data: any[]): number {
  const values = data.map(item => {
    const val = resolveSimplePath(field, item);
    return typeof val === 'number' ? val : parseFloat(val) || 0;
  });

  switch (type) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    case 'AVG':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'MIN':
      return Math.min(...values);
    case 'MAX':
      return Math.max(...values);
    default:
      return 0;
  }
}


function evaluateLocalizeFn(key: any, defaultText: any, locale: any, resources: any, context: ExpressionContext): string {
  const k = String(key ?? '');
  const d = defaultText !== undefined ? String(defaultText) : k;

  // Resolve locale
  let localeCode = locale ? String(locale) : undefined;
  if (!localeCode) {
    localeCode = resolveSimplePath('context.localization.localeCode', context.rootData ?? context.data);
  }

  // Resolve resources
  let res: Record<string, Record<string, string>> | undefined = resources;
  if (!res) {
    res = resolveSimplePath('context.localization.resources', context.rootData ?? context.data);
  }

  if (res && localeCode && res[localeCode] && res[localeCode][k]) {
    return res[localeCode][k];
  }

  return d;
}

function evaluateConvertTzFn(datetimeValue: any, toTz: any, fromTz: any): string {
  const to = String(toTz ?? 'UTC');

  try {
    let date: Date;
    if (typeof datetimeValue === 'string') {
      date = new Date(datetimeValue);
    } else if (datetimeValue instanceof Date) {
      date = datetimeValue;
    } else {
      return String(datetimeValue ?? '');
    }

    if (isNaN(date.getTime())) {
      return String(datetimeValue ?? '');
    }

    const options: Intl.DateTimeFormatOptions = {
      timeZone: to,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const parts = formatter.formatToParts(date);

    const getPart = (type: string) => parts.find(p => p.type === type)?.value ?? '';

    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch (e) {
    return String(datetimeValue ?? '');
  }
}


interface FilterInfo {
  name: string;
  args: string[];
}

function parseFilters(expr: string): { expr: string; filters: FilterInfo[] } {
  const filters: FilterInfo[] = [];
  let mainExpr = expr;
  let inQuote = false;
  let quoteChar = '';
  let depth = 0;

  // Find pipe characters not inside quotes or parentheses
  const pipeIndices: number[] = [];
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if ((char === "'" || char === '"') && (i === 0 || expr[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }

    if (char === '(') depth++;
    if (char === ')') depth--;

    if (char === '|' && !inQuote && depth === 0) {
      pipeIndices.push(i);
    }
  }

  if (pipeIndices.length === 0) {
    return { expr, filters: [] };
  }

  mainExpr = expr.substring(0, pipeIndices[0]).trim();

  for (let i = 0; i < pipeIndices.length; i++) {
    const start = pipeIndices[i] + 1;
    const end = i < pipeIndices.length - 1 ? pipeIndices[i + 1] : expr.length;
    const filterExpr = expr.substring(start, end).trim();

    // Parse filter name and args: "currency:'USD'" or "number:2"
    const colonIndex = filterExpr.indexOf(':');
    if (colonIndex > -1) {
      const name = filterExpr.substring(0, colonIndex).trim();
      const argsStr = filterExpr.substring(colonIndex + 1).trim();
      const args = parseFilterArgs(argsStr);
      filters.push({ name, args });
    } else {
      filters.push({ name: filterExpr, args: [] });
    }
  }

  return { expr: mainExpr, filters };
}

function parseFilterArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if ((char === "'" || char === '"') && (i === 0 || argsStr[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      // Don't include quote chars in the arg
      continue;
    }

    if (char === ',' && !inQuote) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function applyFilter(value: any, filterName: string, args: string[]): any {
  const str = value === null || value === undefined ? '' : String(value);
  const num = typeof value === 'number' ? value : parseFloat(value);

  switch (filterName.toLowerCase()) {
    case 'uppercase':
      return str.toUpperCase();

    case 'lowercase':
      return str.toLowerCase();

    case 'capitalize':
      return str.replace(/\b\w/g, c => c.toUpperCase());

    case 'trim':
      return str.trim();

    case 'currency': {
      const currency = args[0] || 'USD';
      const locale = args[1] || 'en-US';
      if (isNaN(num)) return str;
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
    }

    case 'number': {
      const decimals = parseInt(args[0]) || 0;
      if (isNaN(num)) return str;
      return num.toFixed(decimals);
    }

    case 'percent': {
      const decimals = parseInt(args[0]) || 0;
      if (isNaN(num)) return str;
      return (num * 100).toFixed(decimals) + '%';
    }

    case 'date': {
      const format = args[0] || 'iso';
      const date = new Date(value);
      if (isNaN(date.getTime())) return str;
      if (format === 'iso') return date.toISOString().split('T')[0];
      // Simple format support
      return formatDateSimple(date, format);
    }

    case 'time': {
      const date = new Date(value);
      if (isNaN(date.getTime())) return str;
      return date.toLocaleTimeString();
    }

    case 'datetime': {
      const date = new Date(value);
      if (isNaN(date.getTime())) return str;
      return date.toLocaleString();
    }

    case 'truncate': {
      const length = parseInt(args[0]) || 50;
      const suffix = args[1] || '...';
      if (str.length <= length) return str;
      return str.substring(0, length) + suffix;
    }

    case 'padstart': {
      const length = parseInt(args[0]) || 0;
      const char = args[1] || ' ';
      return str.padStart(length, char);
    }

    case 'padend': {
      const length = parseInt(args[0]) || 0;
      const char = args[1] || ' ';
      return str.padEnd(length, char);
    }

    case 'replace': {
      const search = args[0] || '';
      const replacement = args[1] || '';
      return str.replace(new RegExp(search, 'g'), replacement);
    }

    case 'slice': {
      const start = parseInt(args[0]) || 0;
      const end = args[1] ? parseInt(args[1]) : undefined;
      return str.slice(start, end);
    }

    case 'abs':
      return isNaN(num) ? value : Math.abs(num);

    case 'round':
      return isNaN(num) ? value : Math.round(num);

    case 'floor':
      return isNaN(num) ? value : Math.floor(num);

    case 'ceil':
      return isNaN(num) ? value : Math.ceil(num);

    case 'json':
      return JSON.stringify(value);

    case 'default':
      return value === null || value === undefined || value === '' ? args[0] || '' : value;

    default:
      return value;
  }
}

function formatDateSimple(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return format
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}

function resolvePath(path: string, context: ExpressionContext): any {
  const data = context.data;
  const rootData = context.rootData ?? context.data;

  if (!path) return null;

  // First try to resolve from the current data context
  const firstSegment = path.split(/[.\[]/)[0];

  // Prefer data if the property exists there
  if (data && data[firstSegment] !== undefined) {
    return resolveSimplePath(path, data);
  }

  // Fall back to rootData for root-level data source references
  if (rootData && rootData[firstSegment] !== undefined) {
    return resolveSimplePath(path, rootData);
  }

  return resolveSimplePath(path, data);
}

function resolveSimplePath(path: string, data: any): any {
  if (!data || !path) return null;

  const segments: (string | number)[] = [];
  const regex = /([^.\[\]]+)|\[(\d+)\]/g;
  let match;

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      const segment = match[1];
      segments.push(/^\d+$/.test(segment) ? parseInt(segment, 10) : segment);
    } else if (match[2] !== undefined) {
      segments.push(parseInt(match[2], 10));
    }
  }

  let result = data;
  for (const segment of segments) {
    if (result == null) return null;
    result = result[segment];
  }

  return result;
}

export function evaluateCondition(condition: string, context: ExpressionContext): boolean {
  if (!condition) return true;
  const result = evaluateExpression(condition, context);
  return Boolean(result);
}
