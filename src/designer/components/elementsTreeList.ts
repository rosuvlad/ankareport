import TreeItem, { TreeItemData } from "../../components/treeList/treeItem";
import TreeList from "../../components/treeList/treeList";
import { ReportItem, TextReportItem } from "../../core/reportItems";
import ReportContainer from "../reportContainer/reportContainer";
import ReportSection from "../reportSection/reportSection";

export type ElementsTreeItemData =
  | ElementsTreeItemDataSection
  | ElementsTreeItemDataItem;

export interface ElementsTreeItemDataSection {
  type: "section";
  component: ReportSection;
}

export interface ElementsTreeItemDataItem {
  type: "item";
  component: ReportItem;
}

export interface ElementsTreeListOptions {
  reportContainer: ReportContainer;
}

export default class ElementsTreeList extends TreeList<ElementsTreeItemData> {
  constructor(private readonly options: ElementsTreeListOptions) {
    super({
      collapseByArrow: true,
      itemRenderer: (treeItem, data) => this._itemRenderer(treeItem, data),
    });
  }

  refresh() {
    if (!this.options) return;

    this.dataSource = this.getDataSource();

    super.refresh();
  }

  private _itemRenderer(
    treeItem: TreeItem<ElementsTreeItemData>,
    treeItemData: TreeItemData<ElementsTreeItemData>,
  ) {
    switch (treeItemData.data.type) {
      case "section":
        treeItem.addEventListener("click", () => {
          treeItemData.data.component.element.focus();
        });
        break;
      case "item":
        treeItem.addEventListener("click", () => {
          treeItemData.data.component.element.focus();
        });
        break;
    }
  }

  getDataSource() {
    const sHeader = this.options.reportContainer.report.reportSectionHeader;
    const sPageHeader = this.options.reportContainer.report.reportSectionPageHeader;
    const sContent = this.options.reportContainer.report.reportSectionContent;
    const sPageFooter = this.options.reportContainer.report.reportSectionPageFooter;
    const sFooter = this.options.reportContainer.report.reportSectionFooter;

    // Build tree with subsections shown in correct positions
    const result: TreeItemData<ElementsTreeItemData>[] = [];
    
    // Header (without subsections nested - they're shown below)
    result.push(this.getSectionDataWithoutSubsections(sHeader, "Header"));
    
    // Header subsections (between Header and Page Header)
    for (const subsection of sHeader.subsections) {
      result.push(this.getSectionData(subsection, `Header Section [${subsection.properties.binding || ""}]`));
    }
    
    // Page Header
    result.push(this.getSectionData(sPageHeader, "Page Header"));
    
    // Content (with its subsections nested inside)
    result.push(this.getSectionData(sContent, "Content"));
    
    // Page Footer
    result.push(this.getSectionData(sPageFooter, "Page Footer"));
    
    // Footer subsections (between Page Footer and Footer)
    for (const subsection of sFooter.subsections) {
      result.push(this.getSectionData(subsection, `Footer Section [${subsection.properties.binding || ""}]`));
    }
    
    // Footer (without subsections nested - they're shown above)
    result.push(this.getSectionDataWithoutSubsections(sFooter, "Footer"));
    
    return result;
  }
  
  getSectionDataWithoutSubsections(
    section: ReportSection,
    label?: string,
  ): TreeItemData<ElementsTreeItemData> {
    return {
      label: label || `Section [${section.properties.binding}]`,
      data: {
        type: "section",
        component: section,
      },
      children: [
        ...section.items.map((x) => {
          if (x instanceof TextReportItem) {
            const textReportItem: TextReportItem = x;

            const item: TreeItemData<ElementsTreeItemData> = {
              label: `Text [${
                textReportItem.properties.binding ||
                textReportItem.properties.text ||
                ""
              }]`,
              data: {
                type: "item",
                component: x,
              },
            };
            return item;
          }

          const item: TreeItemData<ElementsTreeItemData> = {
            label: `Image`,
            data: {
              type: "item",
              component: x,
            },
          };

          return item;
        }),
        // No subsections here - they're shown at top level
      ],
    };
  }

  getSectionData(
    section: ReportSection,
    label?: string,
  ): TreeItemData<ElementsTreeItemData> {
    return {
      label: label || `Section [${section.properties.binding}]`,
      data: {
        type: "section",
        component: section,
      },
      children: [
        ...section.items.map((x) => {
          if (x instanceof TextReportItem) {
            const textReportItem: TextReportItem = x;

            const item: TreeItemData<ElementsTreeItemData> = {
              label: `Text [${
                textReportItem.properties.binding ||
                textReportItem.properties.text ||
                ""
              }]`,
              data: {
                type: "item",
                component: x,
              },
            };
            return item;
          }

          const item: TreeItemData<ElementsTreeItemData> = {
            label: `Image`,
            data: {
              type: "item",
              component: x,
            },
          };

          return item;
        }),
        ...section.subsections.map((x) => this.getSectionData(x)),
      ],
    };
  }
}
