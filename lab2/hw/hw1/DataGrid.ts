
import type {
  ColumnDef,
  DataGridProps,
} from "./data-grid-contract";

type SortDirection = "ascending" | "descending";

interface SortState<T> {
  accessorKey: keyof T;
  direction: SortDirection;
}

interface ActiveCell {
  rowIndex: number;
  columnIndex: number;
}

const PAGE_SIZE = 3;

function compareValues(left: unknown, right: unknown): number {
  if (left == null) return right == null ? 0 : 1;
  if (right == null) return -1;

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

// T-04: Sort without mutating the input.
export function sortData<T extends object>(
  data: readonly T[],
  accessorKey: keyof T,
  direction: SortDirection
): T[] {
  return data
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const result = compareValues(
        a.item[accessorKey],
        b.item[accessorKey]
      );

      if (result === 0) return a.index - b.index;

      return direction === "ascending" ? result : -result;
    })
    .map(({ item }) => item);
}

// T-05: Case-insensitive text filtering.
export function filterData<T extends object>(
  data: readonly T[],
  columns: readonly ColumnDef<T>[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) return [...data];

  return data.filter((item) =>
    columns.some((column) =>
      String(item[column.accessorKey] ?? "")
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )
  );
}

let gridCounter = 0;

export class DataGrid<T extends object> {
  private readonly root: HTMLElement;
  private readonly props: DataGridProps<T>;
  private readonly instanceId: string;
  private readonly statusElement: HTMLParagraphElement;

  private sortState: SortState<T> | null = null;
  private filterQuery = "";
  private pageIndex = 0;
  private activeCell: ActiveCell = {
    rowIndex: 0,
    columnIndex: 0,
  };
  private selectedRows = new Set<T>();
  private pendingAnnouncement = "";

  constructor(root: HTMLElement, props: DataGridProps<T>) {
    this.root = root;
    this.props = props;

    gridCounter += 1;
    this.instanceId = `data-grid-${gridCounter}`;

    // Create the live region once. Keep the same DOM node on re-render.
    this.statusElement = document.createElement("p");
    this.statusElement.setAttribute("role", "status");
    this.statusElement.setAttribute("aria-live", "polite");
    this.statusElement.dataset.gridStatus = "";

    this.root.replaceChildren(this.statusElement);
    this.render();
  }

  private announce(message: string): void {
    this.statusElement.textContent = message;
  }

  private setActiveCell(
    table: HTMLTableElement,
    rowIndex: number,
    columnIndex: number,
    moveFocus: boolean
  ): void {
    this.activeCell = { rowIndex, columnIndex };

    const cells = table.querySelectorAll<HTMLElement>(
      '[role="gridcell"][data-row-index][data-column-index]'
    );

    let targetCell: HTMLElement | undefined;

    cells.forEach((cell) => {
      const isActive =
        Number(cell.dataset.rowIndex) === rowIndex &&
        Number(cell.dataset.columnIndex) === columnIndex;

      cell.tabIndex = isActive ? 0 : -1;

      if (isActive) targetCell = cell;
    });

    if (moveFocus) targetCell?.focus();
  }

  // T-07: Arrow navigation, Enter selection, and Space toggle.
  private handleGridKeyDown(
    event: KeyboardEvent,
    displayedData: T[],
    table: HTMLTableElement
  ): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const cell = target.closest<HTMLElement>(
      '[role="gridcell"][data-row-index][data-column-index]'
    );

    if (!cell || displayedData.length === 0) return;

    const rowIndex = Number(cell.dataset.rowIndex);
    const columnIndex = Number(cell.dataset.columnIndex);

    if (
      !Number.isInteger(rowIndex) ||
      !Number.isInteger(columnIndex)
    ) {
      return;
    }

    let nextRow = rowIndex;
    let nextColumn = columnIndex;

    switch (event.key) {
      case "ArrowUp":
        nextRow = Math.max(0, rowIndex - 1);
        break;

      case "ArrowDown":
        nextRow = Math.min(displayedData.length - 1, rowIndex + 1);
        break;

      case "ArrowLeft":
        nextColumn = Math.max(0, columnIndex - 1);
        break;

      case "ArrowRight":
        nextColumn = Math.min(
          this.props.columns.length - 1,
          columnIndex + 1
        );
        break;

      case "Enter": {
        event.preventDefault();

        const item = displayedData[rowIndex];
        if (!item) return;

        this.selectedRows.add(item);
        cell.closest("tr")?.setAttribute("aria-selected", "true");

        this.announce(
          `Row ${this.pageIndex * PAGE_SIZE + rowIndex + 1} selected.`
        );

        this.props.onRowSelect?.(item);
        return;
      }

      case " ": {
        event.preventDefault();

        const item = displayedData[rowIndex];
        if (!item) return;

        const wasSelected = this.selectedRows.has(item);

        if (wasSelected) {
          this.selectedRows.delete(item);
        } else {
          this.selectedRows.add(item);
        }

        cell.closest("tr")?.setAttribute(
          "aria-selected",
          String(!wasSelected)
        );

        this.announce(
          `Row ${this.pageIndex * PAGE_SIZE + rowIndex + 1} ${
            wasSelected ? "deselected" : "selected"
          }.`
        );
        return;
      }

      default:
        // Leave Tab and Shift+Tab to native browser navigation.
        return;
    }

    event.preventDefault();
    this.setActiveCell(table, nextRow, nextColumn, true);
  }

  // T-04: none -> ascending -> descending -> none.
  private toggleSort(column: ColumnDef<T>): void {
    if (!column.sortable) return;

    if (this.sortState?.accessorKey !== column.accessorKey) {
      this.sortState = {
        accessorKey: column.accessorKey,
        direction: "ascending",
      };
    } else if (this.sortState.direction === "ascending") {
      this.sortState = {
        accessorKey: column.accessorKey,
        direction: "descending",
      };
    } else {
      this.sortState = null;
    }

    this.pendingAnnouncement = this.sortState
      ? `Sorted by ${column.header}, ${this.sortState.direction}.`
      : `Sorting cleared for ${column.header}.`;

    const columnIndex = this.props.columns.findIndex(
      (item) => item.accessorKey === column.accessorKey
    );

    this.render();

    this.root
      .querySelector<HTMLButtonElement>(
        `[data-sort-index="${columnIndex}"]`
      )
      ?.focus();
  }

  // T-06: Paginate while keeping focus on a pagination control.
  private changePage(
    nextPage: number,
    pageCount: number,
    activatedControl: "previous" | "next"
  ): void {
    this.pageIndex = Math.max(
      0,
      Math.min(nextPage, pageCount - 1)
    );

    this.pendingAnnouncement =
      `Page ${this.pageIndex + 1} of ${pageCount}.`;

    this.render();

    let control = this.root.querySelector<HTMLButtonElement>(
      `[data-pagination-control="${activatedControl}"]`
    );

    if (control?.disabled) {
      const fallbackControl =
        activatedControl === "next" ? "previous" : "next";

      const fallback = this.root.querySelector<HTMLButtonElement>(
        `[data-pagination-control="${fallbackControl}"]`
      );

      if (fallback && !fallback.disabled) control = fallback;
    }

    if (control && !control.disabled) control.focus();
  }

  private render(): void {
    const filterLabel = document.createElement("label");
    filterLabel.htmlFor = `${this.instanceId}-filter`;
    filterLabel.textContent = "Filter rows";

    const filterInput = document.createElement("input");
    filterInput.id = `${this.instanceId}-filter`;
    filterInput.type = "search";
    filterInput.name = "filter";
    filterInput.value = this.filterQuery;

    filterInput.addEventListener("input", () => {
      const cursorPosition = filterInput.selectionStart;

      this.filterQuery = filterInput.value;
      this.pendingAnnouncement = "Filter results updated.";

      this.render();

      const updatedInput = this.root.querySelector<HTMLInputElement>(
        `#${this.instanceId}-filter`
      );

      updatedInput?.focus();

      if (updatedInput && cursorPosition !== null) {
        const position = Math.min(
          cursorPosition,
          updatedInput.value.length
        );

        updatedInput.setSelectionRange(position, position);
      }
    });

    // Pipeline: filter -> sort -> paginate.
    const filteredData = filterData(
      this.props.data,
      this.props.columns,
      this.filterQuery
    );

    const sortedData = this.sortState
      ? sortData(
          filteredData,
          this.sortState.accessorKey,
          this.sortState.direction
        )
      : filteredData;

    const pageCount = Math.max(
      1,
      Math.ceil(sortedData.length / PAGE_SIZE)
    );

    this.pageIndex = Math.max(
      0,
      Math.min(this.pageIndex, pageCount - 1)
    );

    const startIndex = this.pageIndex * PAGE_SIZE;

    const displayedData = sortedData.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

    if (displayedData.length === 0 || this.props.columns.length === 0) {
      this.activeCell = { rowIndex: 0, columnIndex: 0 };
    } else {
      this.activeCell = {
        rowIndex: Math.min(
          this.activeCell.rowIndex,
          displayedData.length - 1
        ),
        columnIndex: Math.min(
          this.activeCell.columnIndex,
          this.props.columns.length - 1
        ),
      };
    }

    const table = document.createElement("table");
    table.setAttribute("role", "grid");
    table.setAttribute("aria-label", this.props.ariaLabel);
    table.setAttribute("aria-multiselectable", "true");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.setAttribute("role", "row");

    const headerIds = this.props.columns.map(
      (_, index) => `${this.instanceId}-column-${index}`
    );

    this.props.columns.forEach((column, index) => {
      const headerCell = document.createElement("th");
      headerCell.scope = "col";
      headerCell.id = headerIds[index];
      headerCell.setAttribute("role", "columnheader");

      if (column.sortable) {
        const isActive =
          this.sortState?.accessorKey === column.accessorKey;

        const direction = isActive
          ? this.sortState!.direction
          : "none";

        headerCell.setAttribute("aria-sort", direction);

        const sortButton = document.createElement("button");
        sortButton.type = "button";
        sortButton.dataset.sortIndex = String(index);

        const indicator =
          direction === "ascending"
            ? "▲"
            : direction === "descending"
              ? "▼"
              : "↕";

        sortButton.textContent = `${column.header} ${indicator}`;
        sortButton.setAttribute(
          "aria-label",
          `Sort by ${column.header}. Current order: ${direction}.`
        );

        sortButton.addEventListener("click", () => {
          this.toggleSort(column);
        });

        headerCell.appendChild(sortButton);
      } else {
        headerCell.textContent = column.header;
      }

      headerRow.appendChild(headerCell);
    });

    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    if (displayedData.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.setAttribute("role", "row");

      const emptyCell = document.createElement("td");
      emptyCell.setAttribute("role", "gridcell");
      emptyCell.colSpan = Math.max(1, this.props.columns.length);
      emptyCell.dataset.rowIndex = "0";
      emptyCell.dataset.columnIndex = "0";
      emptyCell.tabIndex = 0;

      emptyCell.textContent = this.filterQuery.trim()
        ? "No rows match your filter."
        : "No data available.";

      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      displayedData.forEach((item, rowIndex) => {
        const row = document.createElement("tr");
        row.setAttribute("role", "row");
        row.setAttribute(
          "aria-selected",
          String(this.selectedRows.has(item))
        );

        this.props.columns.forEach((column, columnIndex) => {
          const cell = document.createElement("td");

          cell.setAttribute("role", "gridcell");
          cell.setAttribute("headers", headerIds[columnIndex]);
          cell.dataset.rowIndex = String(rowIndex);
          cell.dataset.columnIndex = String(columnIndex);

          cell.tabIndex =
            rowIndex === this.activeCell.rowIndex &&
            columnIndex === this.activeCell.columnIndex
              ? 0
              : -1;

          const value = item[column.accessorKey];

          // Render data as text, never as HTML.
          cell.textContent =
            value === null || value === undefined
              ? ""
              : String(value);

          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });
    }

    table.append(thead, tbody);

    table.addEventListener("focusin", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const cell = target.closest<HTMLElement>(
        '[role="gridcell"][data-row-index][data-column-index]'
      );

      if (!cell || displayedData.length === 0) return;

      this.setActiveCell(
        table,
        Number(cell.dataset.rowIndex),
        Number(cell.dataset.columnIndex),
        false
      );
    });

    table.addEventListener("keydown", (event) => {
      this.handleGridKeyDown(event, displayedData, table);
    });

    const pagination = document.createElement("nav");
    pagination.setAttribute("aria-label", "Table pagination");

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.textContent = "Previous";
    previousButton.dataset.paginationControl = "previous";
    previousButton.disabled = this.pageIndex === 0;

    previousButton.addEventListener("click", () => {
      this.changePage(
        this.pageIndex - 1,
        pageCount,
        "previous"
      );
    });

    const pageIndicator = document.createElement("p");
    pageIndicator.textContent =
      `Page ${this.pageIndex + 1} of ${pageCount}`;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "Next";
    nextButton.dataset.paginationControl = "next";
    nextButton.disabled = this.pageIndex >= pageCount - 1;

    nextButton.addEventListener("click", () => {
      this.changePage(
        this.pageIndex + 1,
        pageCount,
        "next"
      );
    });

    pagination.append(previousButton, pageIndicator, nextButton);

    // Keep the live region mounted while replacing the other controls.
    const summary = this.filterQuery.trim()
      ? `${filteredData.length} of ${this.props.data.length} rows match the filter. Page ${this.pageIndex + 1} of ${pageCount}.`
      : `${sortedData.length} rows available. Page ${this.pageIndex + 1} of ${pageCount}.`;

    this.statusElement.textContent = this.pendingAnnouncement
      ? `${this.pendingAnnouncement} ${summary}`
      : summary;

    this.pendingAnnouncement = "";

    for (const child of Array.from(this.root.children)) {
      if (child !== this.statusElement) child.remove();
    }

    this.root.insertBefore(filterLabel, this.statusElement);
    this.root.insertBefore(filterInput, this.statusElement);
    this.root.insertBefore(table, this.statusElement);
    this.root.insertBefore(pagination, this.statusElement);
  }
}

// Demo data.
interface Employee {
  id: number;
  name: string;
  department: string;
  status: string;
}

const employees: Employee[] = [
  { id: 1, name: "An Nguyen", department: "IT", status: "Active" },
  { id: 2, name: "Binh Tran", department: "HR", status: "Active" },
  { id: 3, name: "Chi Le", department: "Finance", status: "Inactive" },
  { id: 4, name: "Dung Pham", department: "IT", status: "Active" },
];

const columns: ColumnDef<Employee>[] = [
  { header: "ID", accessorKey: "id", sortable: true },
  { header: "Name", accessorKey: "name", sortable: true },
  { header: "Department", accessorKey: "department", sortable: true },
  { header: "Status", accessorKey: "status", sortable: true },
];

const root = document.getElementById("data-grid-root");

if (root) {
  new DataGrid<Employee>(root, {
    data: employees,
    columns,
    ariaLabel: "Employee data",
  });
}
