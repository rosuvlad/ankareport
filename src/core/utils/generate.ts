import { ILayout, IReportItem, ISection } from "../layout";
import { evaluateExpression, evaluateCondition, ExpressionContext, resolveSimplePath } from "./expression";
import { formatDate, formatNumber } from "./format";

export interface GenerateContext {
  rootData: any;
  pageNum?: number;
  totalPages?: number;
}

export interface SectionGroup {
  startY: number;
  endY: number;
  keepTogether: boolean;
  sectionType: 'header' | 'content' | 'footer' | 'subsection';
}

export interface GenerateResult {
  items: IReportItem[];
  sectionGroups: SectionGroup[];
}

export function generateItemsWithSections(layout: ILayout, data: any, genContext?: GenerateContext): GenerateResult {
  const items: IReportItem[] = [];
  const sectionGroups: SectionGroup[] = [];
  const rootData = genContext?.rootData ?? data;

  let topMargin = 0;

  // Header section
  const headerData = resolveSectionData(layout.headerSection.binding, data);
  const headerStartY = topMargin;
  const headerElements = getSectionItems(topMargin, layout.headerSection, headerData, undefined, { rootData, ...genContext });
  topMargin += headerElements.height;
  items.push(...headerElements.items);
  sectionGroups.push({
    startY: headerStartY,
    endY: topMargin,
    keepTogether: false,
    sectionType: 'header',
  });

  // Content section
  if (layout.contentSection.binding && data && Array.isArray(data[layout.contentSection.binding])) {
    let contentArray = data[layout.contentSection.binding];
    const keepTogether = layout.contentSection.keepTogether ?? false;

    // Apply sorting
    if (layout.contentSection.orderBy) {
      contentArray = sortData(contentArray, layout.contentSection.orderBy);
    }

    if (layout.contentSection.groupBy) {
      const groupedResult = processGroupedContentWithSections(topMargin, layout.contentSection, contentArray, { rootData, ...genContext });
      topMargin += groupedResult.height;
      items.push(...groupedResult.items);
      sectionGroups.push(...groupedResult.sectionGroups);
    } else {
      for (let i = 0; i < contentArray.length; i++) {
        const contentStartY = topMargin;
        const contentElements = getSectionItems(topMargin, layout.contentSection, contentArray[i], i, { rootData, ...genContext });
        topMargin += contentElements.height;
        items.push(...contentElements.items);
        sectionGroups.push({
          startY: contentStartY,
          endY: topMargin,
          keepTogether,
          sectionType: 'content',
        });
      }
    }
  } else {
    const contentStartY = topMargin;
    const contentElements = getSectionItems(topMargin, layout.contentSection, data, undefined, { rootData, ...genContext });
    topMargin += contentElements.height;
    items.push(...contentElements.items);
    sectionGroups.push({
      startY: contentStartY,
      endY: topMargin,
      keepTogether: layout.contentSection.keepTogether ?? false,
      sectionType: 'content',
    });
  }

  // Footer section
  const footerData = resolveSectionData(layout.footerSection.binding, data);
  const footerStartY = topMargin;
  const footerElements = getSectionItems(topMargin, layout.footerSection, footerData, undefined, { rootData, ...genContext });
  topMargin += footerElements.height;
  items.push(...footerElements.items);
  sectionGroups.push({
    startY: footerStartY,
    endY: topMargin,
    keepTogether: false,
    sectionType: 'footer',
  });

  return { items, sectionGroups };
}

function processGroupedContentWithSections(topMargin: number, section: ISection, dataArray: any[], sectionContext: SectionContext) {
  const items: IReportItem[] = [];
  const sectionGroups: SectionGroup[] = [];
  let height = 0;
  const groupBy = section.groupBy!;
  const keepTogether = section.keepTogether ?? false;

  const groups = new Map<any, any[]>();
  for (const item of dataArray) {
    const key = item[groupBy];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  let globalIndex = 0;

  for (const [groupKey, groupData] of groups) {
    const groupContext: SectionContext = {
      rootData: sectionContext.rootData,
      pageNum: sectionContext.pageNum,
      totalPages: sectionContext.totalPages,
      groupKey,
      groupCount: groupData.length,
      groupData,
    };

    if (section.groupHeader) {
      const headerElements = getSectionItems(
        topMargin + height,
        section.groupHeader,
        groupData[0],
        undefined,
        groupContext
      );
      height += headerElements.height;
      items.push(...headerElements.items);
    }

    for (let i = 0; i < groupData.length; i++) {
      const itemStartY = topMargin + height;
      const itemElements = getSectionItems(
        topMargin + height,
        section,
        groupData[i],
        globalIndex,
        groupContext
      );
      height += itemElements.height;
      items.push(...itemElements.items);
      sectionGroups.push({
        startY: itemStartY,
        endY: topMargin + height,
        keepTogether,
        sectionType: 'content',
      });
      globalIndex++;
    }

    if (section.groupFooter) {
      const footerElements = getSectionItems(
        topMargin + height,
        section.groupFooter,
        groupData[groupData.length - 1],
        undefined,
        groupContext
      );
      height += footerElements.height;
      items.push(...footerElements.items);
    }
  }

  return { height, items, sectionGroups };
}

export function generateItems(layout: ILayout, data: any, genContext?: GenerateContext): IReportItem[] {
  const items: IReportItem[] = [];
  const rootData = genContext?.rootData ?? data;

  let topMargin = 0;

  const headerData = resolveSectionData(layout.headerSection.binding, data);
  const headerElements = getSectionItems(topMargin, layout.headerSection, headerData, undefined, { rootData, ...genContext });
  topMargin += headerElements.height;
  items.push(...headerElements.items);

  if (layout.contentSection.binding && data && Array.isArray(data[layout.contentSection.binding])) {
    let contentArray = data[layout.contentSection.binding];

    // Apply sorting
    if (layout.contentSection.orderBy) {
      contentArray = sortData(contentArray, layout.contentSection.orderBy);
    }

    // Check if grouping is enabled
    if (layout.contentSection.groupBy) {
      const groupedResult = processGroupedContent(topMargin, layout.contentSection, contentArray, { rootData, ...genContext });
      topMargin += groupedResult.height;
      items.push(...groupedResult.items);
    } else {
      for (let i = 0; i < contentArray.length; i++) {
        const contentElements = getSectionItems(topMargin, layout.contentSection, contentArray[i], i, { rootData, ...genContext });
        topMargin += contentElements.height;
        items.push(...contentElements.items);
      }
    }
  } else {
    const contentElements = getSectionItems(topMargin, layout.contentSection, data, undefined, { rootData, ...genContext });
    topMargin += contentElements.height;
    items.push(...contentElements.items);
  }

  const footerData = resolveSectionData(layout.footerSection.binding, data);
  const footerElements = getSectionItems(topMargin, layout.footerSection, footerData, undefined, { rootData, ...genContext });
  topMargin += footerElements.height;
  items.push(...footerElements.items);

  return items;
}

function processGroupedContent(topMargin: number, section: ISection, dataArray: any[], sectionContext: SectionContext) {
  const items: IReportItem[] = [];
  let height = 0;
  const groupBy = section.groupBy!;

  // Group data by the specified field
  const groups = new Map<any, any[]>();
  for (const item of dataArray) {
    const key = item[groupBy];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  let globalIndex = 0;

  // Process each group
  for (const [groupKey, groupData] of groups) {
    const groupContext: SectionContext = {
      rootData: sectionContext.rootData,
      pageNum: sectionContext.pageNum,
      totalPages: sectionContext.totalPages,
      groupKey,
      groupCount: groupData.length,
      groupData,
    };

    // Render group header if defined
    if (section.groupHeader) {
      const headerElements = getSectionItems(
        topMargin + height,
        section.groupHeader,
        groupData[0], // Use first item for header context
        undefined,
        groupContext
      );
      height += headerElements.height;
      items.push(...headerElements.items);
    }

    // Render group items
    for (let i = 0; i < groupData.length; i++) {
      const itemElements = getSectionItems(
        topMargin + height,
        section,
        groupData[i],
        globalIndex,
        groupContext
      );
      height += itemElements.height;
      items.push(...itemElements.items);
      globalIndex++;
    }

    // Render group footer if defined
    if (section.groupFooter) {
      const footerElements = getSectionItems(
        topMargin + height,
        section.groupFooter,
        groupData[groupData.length - 1], // Use last item for footer context
        undefined,
        groupContext
      );
      height += footerElements.height;
      items.push(...footerElements.items);
    }
  }

  return { height, items };
}

function resolveSectionData(binding: string, data: any): any {
  if (!binding || !data) return data;
  const context: ExpressionContext = { data };
  const result = evaluateExpression(binding, context);
  return result ?? data;
}

interface SectionContext {
  rootData: any;
  pageNum?: number;
  totalPages?: number;
  groupKey?: any;
  groupCount?: number;
  groupData?: any[];
}

function calculateAutoHeight(section: ISection): number {
  let maxBottom = 0;

  // Use original section item positions (before topMargin is added)
  for (const item of section.items || []) {
    const itemBottom = (item.y || 0) + (item.height || 0);
    if (itemBottom > maxBottom) {
      maxBottom = itemBottom;
    }
  }

  return maxBottom + 10; // Add padding
}

function getSectionItems(topMargin: number, section: ISection, data: any, index?: number, sectionContext?: SectionContext) {
  let height = section.height === "auto" ? 0 : section.height;

  const context: ExpressionContext = {
    data,
    rootData: sectionContext?.rootData ?? data,
    index,
    pageNum: sectionContext?.pageNum,
    totalPages: sectionContext?.totalPages,
    groupKey: sectionContext?.groupKey,
    groupCount: sectionContext?.groupCount,
    groupData: sectionContext?.groupData,
  };

  const items: IReportItem[] = section.items?.filter(item => {
    // Check visibility condition
    if (!item.visible) return true;
    return evaluateCondition(item.visible, context);
  }).map(item => {
    var result = {
      ...item,
      x: item.x,
      y: topMargin + item.y,
      width: item.width,
      height: item.height,
    };

    if (result.type === "text" && result.binding) {
      let bindedData = evaluateExpression(result.binding, context) ?? "NULL";

      if (result.format && typeof bindedData !== 'string') {
        if (typeof bindedData === "number") {
          bindedData = formatNumber(bindedData, result.format);
        } else if (new Date(bindedData).toString() !== "Invalid Date") {
          bindedData = formatDate(bindedData, result.format);
        }
      }

      result.text = String(bindedData);
    }

    // Handle barcode binding
    if (result.type === "barcode" && (result as any).binding) {
      const bindedData = evaluateExpression((result as any).binding, context);
      (result as any).value = String(bindedData ?? "");
    }

    // Handle qrcode binding
    if (result.type === "qrcode" && (result as any).binding) {
      const bindedData = evaluateExpression((result as any).binding, context);
      (result as any).value = String(bindedData ?? "");
    }

    // Handle image binding
    if (result.type === "image" && (result as any).binding) {
      const bindedData = evaluateExpression((result as any).binding, context);
      (result as any).source = String(bindedData ?? "");
    }

    // Handle chart bindings
    if (result.type === "chart") {
      const chartResult = result as any;

      // Resolve labels binding
      if (chartResult.labelsBinding) {
        const labels = evaluateExpression(chartResult.labelsBinding, context);
        if (Array.isArray(labels)) {
          chartResult.labels = labels.map((l: any) => String(l));
        }
      }

      // Resolve datasets binding
      if (chartResult.datasetsBinding) {

        const datasets = evaluateExpression(chartResult.datasetsBinding, context);

        if (Array.isArray(datasets)) {
          chartResult.datasets = datasets;
        }
      }

      // Process datasets (whether from binding or static layout)
      if (Array.isArray(chartResult.datasets)) {
        chartResult.datasets = chartResult.datasets.map((ds: any) => {
          const resolvedDs = { ...ds };

          if (ds.labelBinding) {
            resolvedDs.label = String(evaluateExpression(ds.labelBinding, context) ?? ds.label ?? "");
          }

          if (ds.dataBinding) {
            const data = evaluateExpression(ds.dataBinding, context);

            if (Array.isArray(data)) {
              resolvedDs.data = data;
            }
          }

          // Also resolve backgroundColor/borderColor if needed (optional enhancement)
          return resolvedDs;
        });
      }

      // Resolve title binding (supports LOCALIZE)
      if (chartResult.titleBinding) {
        chartResult.title = String(evaluateExpression(chartResult.titleBinding, context) ?? chartResult.title ?? "");
      }

      // Resolve legend title binding
      if (chartResult.legend?.titleBinding) {
        chartResult.legend = {
          ...chartResult.legend,
          title: String(evaluateExpression(chartResult.legend.titleBinding, context) ?? chartResult.legend.title ?? ""),
        };
      }

      // Resolve axis title bindings
      if (chartResult.scales?.x?.title?.textBinding) {
        chartResult.scales = {
          ...chartResult.scales,
          x: {
            ...chartResult.scales.x,
            title: {
              ...chartResult.scales.x.title,
              text: String(evaluateExpression(chartResult.scales.x.title.textBinding, context) ?? chartResult.scales.x.title.text ?? ""),
            },
          },
        };
      }
      if (chartResult.scales?.y?.title?.textBinding) {
        chartResult.scales = {
          ...chartResult.scales,
          y: {
            ...chartResult.scales.y,
            title: {
              ...chartResult.scales.y.title,
              text: String(evaluateExpression(chartResult.scales.y.title.textBinding, context) ?? chartResult.scales.y.title.text ?? ""),
            },
          },
        };
      }

      // Resolve axis min/max bindings
      if (chartResult.scales?.y?.minBinding) {
        const min = evaluateExpression(chartResult.scales.y.minBinding, context);
        if (typeof min === 'number') {
          chartResult.scales.y.min = min;
        }
      }
      if (chartResult.scales?.y?.maxBinding) {
        const max = evaluateExpression(chartResult.scales.y.maxBinding, context);
        if (typeof max === 'number') {
          chartResult.scales.y.max = max;
        }
      }
    }

    // Apply conditional styles
    if (item.conditionalStyles) {
      for (const cs of item.conditionalStyles) {
        if (evaluateCondition(cs.condition, context)) {
          if (cs.color) result.color = cs.color;
          if (cs.backgroundColor) result.backgroundColor = cs.backgroundColor;
          if (cs.fontWeight) result.fontWeight = cs.fontWeight;
          if (cs.fontSize) result.fontSize = cs.fontSize;
          if (cs.borderColor) result.borderColor = cs.borderColor;
        }
      }
    }

    if (!result.color) result.color = "#000000";
    if (!result.fontSize) result.fontSize = "12px";
    if (!result.fontFamily) result.fontFamily = "Arial";

    return result;
  }) ?? [];

  // Calculate auto height from items before processing subsections
  if (section.height === "auto") {
    height = calculateAutoHeight(section);
  }

  if (section.sections) {
    for (const subSection of section.sections) {
      let subData = subSection.binding && data ? data[subSection.binding] : null;
      if (Array.isArray(subData)) {
        // Apply sorting to subsection data
        if (subSection.orderBy) {
          subData = sortData(subData, subSection.orderBy);
        }
        for (let i = 0; i < subData.length; i++) {
          const subItems = getSectionItems(topMargin + height, subSection, subData[i], i, sectionContext);
          height += subItems.height;
          items.push(...subItems.items);
        }
      } else {
        const subItems = getSectionItems(topMargin + height, subSection, subData, undefined, sectionContext);
        height += subItems.height;
        items.push(...subItems.items);
      }
    }
  }

  return {
    height,
    items,
  };
}

export function generatePageSectionItems(
  section: ISection,
  data: any,
  yOffset: number,
  context: ExpressionContext
): IReportItem[] {
  // Reuse getSectionItems to handle all item types (text, charts, etc.)
  // and all bindings/expressions correctly.
  const sectionItems = getSectionItems(yOffset, section, data, undefined, {
    rootData: context.rootData,
    pageNum: context.pageNum,
    totalPages: context.totalPages
  });

  return sectionItems.items;
}

/**
 * Sort data by one or more properties (comma-separated or array)
 * Supports direction: "field ASC" or "field DESC"
 * Supports nested paths: "nested.field DESC"
 */
export function sortData(data: any[], orderBy: string | string[]): any[] {
  if (!Array.isArray(data) || !orderBy) return data;

  const fields = typeof orderBy === 'string'
    ? orderBy.split(',').map(f => f.trim()).filter(f => f)
    : orderBy;

  if (fields.length === 0) return data;

  const sortSpecs = fields.map(s => {
    const parts = s.split(/\s+/);
    const field = parts[0];
    const direction = parts[1]?.toUpperCase() || 'ASC';
    return {
      field,
      isDesc: direction === 'DESC'
    };
  });

  return [...data].sort((a, b) => {
    for (const spec of sortSpecs) {
      const valA = resolveSimplePath(spec.field, a);
      const valB = resolveSimplePath(spec.field, b);

      if (valA === valB) continue;

      if (valA < valB) return spec.isDesc ? 1 : -1;
      if (valA > valB) return spec.isDesc ? -1 : 1;
    }
    return 0;
  });
}
