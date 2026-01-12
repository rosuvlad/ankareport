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

function evaluateCore(expr: string, context: ExpressionContext): any {
  // Handle ternary expressions: condition ? trueValue : falseValue
  const ternaryMatch = parseTernary(expr);
  if (ternaryMatch) {
    const condition = evaluateCore(ternaryMatch.condition, context);
    return condition ? evaluateCore(ternaryMatch.trueValue, context) : evaluateCore(ternaryMatch.falseValue, context);
  }

  // Handle fallback (null coalescing): value ?? fallback
  const fallbackMatch = expr.match(/^(.+?)\s*\?\?\s*(.+)$/);
  if (fallbackMatch) {
    const value = evaluateCore(fallbackMatch[1].trim(), context);
    if (value === null || value === undefined) {
      return evaluateCore(fallbackMatch[2].trim(), context);
    }
    return value;
  }

  // Handle comparison expressions for conditions
  const comparisonResult = evaluateComparison(expr, context);
  if (comparisonResult !== undefined) {
    return comparisonResult;
  }

  // Handle arithmetic expressions
  const arithmeticResult = evaluateArithmetic(expr, context);
  if (arithmeticResult !== undefined) {
    return arithmeticResult;
  }

  // Handle string concatenation with +
  if (expr.includes('+') && (expr.includes("'") || expr.includes('"'))) {
    return evaluateStringConcat(expr, context);
  }

  // Handle aggregate functions
  const aggregateMatch = expr.match(/^(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(.+)\s*\)$/i);
  if (aggregateMatch) {
    return evaluateAggregate(aggregateMatch[1].toUpperCase(), aggregateMatch[2].trim(), context);
  }

  // Handle LOCALIZE function
  const localizeMatch = expr.match(/^LOCALIZE\s*\(\s*(.+)\s*\)$/i);
  if (localizeMatch) {
    return evaluateLocalize(localizeMatch[1].trim(), context);
  }

  // Handle CONVERT_TZ function: CONVERT_TZ(datetime, fromTz, toTz)
  const convertTzMatch = expr.match(/^CONVERT_TZ\s*\(\s*(.+)\s*\)$/i);
  if (convertTzMatch) {
    return evaluateConvertTz(convertTzMatch[1].trim(), context);
  }

  // Handle special variables
  const specialValue = evaluateSpecialVariable(expr, context);
  if (specialValue !== undefined) {
    return specialValue;
  }

  // Handle inline array literals like [{...}, {...}]
  if (expr.startsWith('[') && expr.endsWith(']')) {
    try {
      // Build a safe evaluation context with data properties
      const data = context.data || {};
      const rootData = context.rootData || data;
      const evalFn = new Function('data', 'rootData', `with(rootData) { with(data) { return ${expr}; } }`);
      return evalFn(data, rootData);
    } catch (e) {
      console.error('[EXPR] Array literal eval error:', e);
      return undefined;
    }
  }

  // Handle string literals
  if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr.slice(1, -1);
  }

  // Handle numeric literals
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return parseFloat(expr);
  }

  // Handle boolean literals
  if (expr === 'true') return true;
  if (expr === 'false') return false;

  // Handle path resolution (property access)
  return resolvePath(expr, context);
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

function evaluateAggregate(func: string, path: string, context: ExpressionContext): any {
  // Parse path like "items.amount" or "ds_OrderLines.total"
  const parts = path.split('.');
  let array: any[];

  if (parts.length === 1) {
    // Just array name, count items
    array = resolvePath(parts[0], context);
  } else {
    // Array.field format
    const arrayPath = parts.slice(0, -1).join('.');
    const fieldName = parts[parts.length - 1];
    array = resolvePath(arrayPath, context);

    if (!Array.isArray(array)) return null;

    if (func === 'COUNT') {
      return array.length;
    }

    const values = array.map(item => {
      const val = item[fieldName];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    switch (func) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);
      case 'AVG':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'MIN':
        return Math.min(...values);
      case 'MAX':
        return Math.max(...values);
    }
  }

  if (!Array.isArray(array)) return null;

  if (func === 'COUNT') {
    return array.length;
  }

  return null;
}

function evaluateLocalize(argsStr: string, context: ExpressionContext): string {
  // Parse LOCALIZE arguments: key, defaultText (optional), localeCode (optional), resourcePath (optional)
  const args = parseLocalizeArgs(argsStr);
  
  if (args.length < 1) {
    return '';
  }

  const key = evaluateCore(args[0].trim(), context);
  const defaultText = args.length >= 2 ? evaluateCore(args[1].trim(), context) : key;
  
  // Get locale code: from 3rd arg, or from context data["context"]["localization"]["localeCode"]
  let localeCode: string | undefined;
  if (args.length >= 3 && args[2].trim()) {
    localeCode = String(evaluateCore(args[2].trim(), context));
  } else {
    localeCode = resolveSimplePath('context.localization.localeCode', context.rootData ?? context.data);
  }

  // Get resources: from 4th arg path, or from data["context"]["localization"]["resources"]
  let resources: Record<string, Record<string, string>> | undefined;
  if (args.length >= 4 && args[3].trim()) {
    resources = resolvePath(args[3].trim(), context);
  } else {
    resources = resolveSimplePath('context.localization.resources', context.rootData ?? context.data);
  }

  // Look up the localized string
  if (resources && localeCode && resources[localeCode] && resources[localeCode][key]) {
    return resources[localeCode][key];
  }

  // Fallback to default text
  return String(defaultText ?? key ?? '');
}

function evaluateConvertTz(argsStr: string, context: ExpressionContext): string {
  // Parse CONVERT_TZ arguments: datetime, toTz, fromTz (optional, defaults to UTC)
  const args = parseLocalizeArgs(argsStr); // Reuse the same arg parser
  
  if (args.length < 2) {
    return '';
  }

  const datetimeValue = evaluateCore(args[0].trim(), context);
  const toTz = String(evaluateCore(args[1].trim(), context));
  const fromTz = args.length >= 3 ? String(evaluateCore(args[2].trim(), context)) : 'UTC';

  try {
    // Parse the input datetime
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

    // Convert to target timezone using Intl.DateTimeFormat
    const options: Intl.DateTimeFormatOptions = {
      timeZone: toTz,
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
    
    // Return ISO-like format: YYYY-MM-DDTHH:mm:ss
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  } catch (e) {
    // If timezone is invalid, return original value
    return String(datetimeValue ?? '');
  }
}

function parseLocalizeArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
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
      current += char;
    } else if (char === '(' && !inQuote) {
      depth++;
      current += char;
    } else if (char === ')' && !inQuote) {
      depth--;
      current += char;
    } else if (char === ',' && !inQuote && depth === 0) {
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

function evaluateComparison(expr: string, context: ExpressionContext): boolean | undefined {
  // Match comparison operators
  const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];

  for (const op of operators) {
    const index = expr.indexOf(op);
    if (index > 0) {
      const left = evaluateCore(expr.substring(0, index).trim(), context);
      const right = evaluateCore(expr.substring(index + op.length).trim(), context);

      switch (op) {
        case '===': return left === right;
        case '!==': return left !== right;
        case '==': return left == right;
        case '!=': return left != right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '<': return left < right;
      }
    }
  }

  return undefined;
}

function evaluateArithmetic(expr: string, context: ExpressionContext): number | undefined {
  // Handle parentheses first
  if (expr.includes('(') && !expr.match(/^(SUM|COUNT|AVG|MIN|MAX)\s*\(/i)) {
    const parenExpr = expr.replace(/\(([^()]+)\)/g, (_, inner) => {
      return String(evaluateCore(inner, context));
    });
    if (parenExpr !== expr) {
      return evaluateArithmetic(parenExpr, context);
    }
  }

  // Check if this looks like an arithmetic expression
  if (!/[+\-*\/]/.test(expr)) return undefined;

  // Don't process if it contains string literals (handled by string concat)
  if (expr.includes("'") || expr.includes('"')) return undefined;

  // Split by + and - (lower precedence)
  const addSubMatch = expr.match(/^(.+?)([+\-])([^+\-]+)$/);
  if (addSubMatch) {
    const left = evaluateCore(addSubMatch[1].trim(), context);
    const right = evaluateCore(addSubMatch[3].trim(), context);
    const leftNum = typeof left === 'number' ? left : parseFloat(left);
    const rightNum = typeof right === 'number' ? right : parseFloat(right);

    if (!isNaN(leftNum) && !isNaN(rightNum)) {
      return addSubMatch[2] === '+' ? leftNum + rightNum : leftNum - rightNum;
    }
  }

  // Split by * and / (higher precedence)
  const mulDivMatch = expr.match(/^(.+?)([*\/])([^*\/]+)$/);
  if (mulDivMatch) {
    const left = evaluateCore(mulDivMatch[1].trim(), context);
    const right = evaluateCore(mulDivMatch[3].trim(), context);
    const leftNum = typeof left === 'number' ? left : parseFloat(left);
    const rightNum = typeof right === 'number' ? right : parseFloat(right);

    if (!isNaN(leftNum) && !isNaN(rightNum)) {
      return mulDivMatch[2] === '*' ? leftNum * rightNum : leftNum / rightNum;
    }
  }

  return undefined;
}

function evaluateStringConcat(expr: string, context: ExpressionContext): string {
  // Split by + but respect quotes
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if ((char === "'" || char === '"') && (i === 0 || expr[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
      current += char;
    } else if (char === '+' && !inQuote) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());

  return parts.map(part => {
    const val = evaluateCore(part, context);
    return val === null || val === undefined ? '' : String(val);
  }).join('');
}

function parseTernary(expr: string): { condition: string; trueValue: string; falseValue: string } | null {
  let depth = 0;
  let questionIndex = -1;
  let colonIndex = -1;
  let inQuote = false;
  let quoteChar = '';

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

    if (inQuote) continue;

    if (char === '(') depth++;
    if (char === ')') depth--;

    if (depth === 0) {
      if (char === '?' && expr[i + 1] !== '?') {
        questionIndex = i;
      } else if (char === ':' && questionIndex > -1) {
        colonIndex = i;
        break;
      }
    }
  }

  if (questionIndex > -1 && colonIndex > questionIndex) {
    return {
      condition: expr.substring(0, questionIndex).trim(),
      trueValue: expr.substring(questionIndex + 1, colonIndex).trim(),
      falseValue: expr.substring(colonIndex + 1).trim(),
    };
  }

  return null;
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
