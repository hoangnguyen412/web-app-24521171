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

// Compare numbers numerically and other values as text.
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

// T-04: Pure sorting function.
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

      if (result === 0) {
        return a.index - b.index;
      }

      return direction === "ascending" ? result : -result;
    })
    .map(({ item }) => item);
}

// T-05: Pure, case-insensitive filtering function.
export function filterData<T extends object>(
  data: readonly T[],
  columns: readonly ColumnDef<T>[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return [...data];
  }

  return data.filter((item) =>
    columns.some((column) => {
      const value = item[column.accessorKey];

      return String(value ?? "")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    })
  );
}

let gridCounter = 0;

export class DataGrid<T extends object> {
  private readonly root: HTMLElement;
  private readonly props: DataGridProps<T>;
  private readonly instanceId: string;

  private sortState: SortState<T> | null = null;
  private filterQuery = "";
  private pageIndex = 0;

  // T-07: Currently active cell.
  private activeCell: ActiveCell = {
    rowIndex: 0,
    columnIndex: 0,
  };

  // Track selected rows by their object references.
  private selectedRows = new Set<T>();

  constructor(root: HTMLElement, props: DataGridProps<T>) {
    this.root = root;
    this.props = props;

    gridCounter += 1;
    this.instanceId = `data-grid-${gridCounter}`;

    this.render();
  }

  private announce(message: string): void {
    const status = this.root.querySelector<HTMLElement>(
      "[data-grid-status]"
    );

    if (status) {
      status.textContent = message;
    }
  }

  // Update roving tabindex and optionally move keyboard focus.
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
      const currentRow = Number(cell.dataset.rowIndex);
      const currentColumn = Number(cell.dataset.columnIndex);

      const isActive =
        currentRow === rowIndex &&
        currentColumn === columnIndex;

      cell.tabIndex = isActive ? 0 : -1;

      if (isActive) {
        targetCell = cell;
      }
    });

    if (moveFocus) {
      targetCell?.focus();
    }
  }

  // T-07: Keyboard navigation and row selection.
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

    if (!cell) return;

    // No row navigation or selection when the grid has no results.
    if (displayedData.length === 0) return;

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
        nextRow = Math.min(
          displayedData.length - 1,
          rowIndex + 1
        );
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

        // Enter selects the row and calls the contract callback.
        this.selectedRows.add(item);

        cell.closest("tr")?.setAttribute(
          "aria-selected",
          "true"
        );

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

        // Space toggles the selection state.
        const isSelected = this.selectedRows.has(item);

        if (isSelected) {
          this.selectedRows.delete(item);
        } else {
          this.selectedRows.add(item);
        }

        cell.closest("tr")?.setAttribute(
          "aria-selected",
          String(!isSelected)
        );

        this.announce(
          `Row ${this.pageIndex * PAGE_SIZE + rowIndex + 1} ${
            isSelected ? "deselected" : "selected"
          }.`
        );

        return;
      }

      default:
        // Tab and Shift+Tab use the browser's normal navigation.
        return;
    }

    // Prevent arrow keys from scrolling the page.
    event.preventDefault();

    this.setActiveCell(
      table,
      nextRow,
      nextColumn,
      true
    );
  }

  // T-04: Cycle none -> ascending -> descending -> none.
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

    const columnIndex = this.props.columns.findIndex(
      (item) => item.accessorKey === column.accessorKey
    );

    this.render();

    // Preserve focus on the sort button after re-rendering.
    this.root
      .querySelector<HTMLButtonElement>(
        `[data-sort-index="${columnIndex}"]`
      )
      ?.focus();
  }

  // T-06: Pagination with focus preservation.
  private changePage(
    nextPage: number,
    pageCount: number,
    activatedControl: "previous" | "next"
  ): void {
    this.pageIndex = Math.max(
      0,
      Math.min(nextPage, pageCount - 1)
    );

    this.render();

    let control = this.root.querySelector<HTMLButtonElement>(
      `[data-pagination-control="${activatedControl}"]`
    );

    // If the activated button becomes disabled, focus the other button.
    if (control?.disabled) {
      const fallbackControl =
        activatedControl === "next" ? "previous" : "next";

      const fallback = this.root.querySelector<HTMLButtonElement>(
        `[data-pagination-control="${fallbackControl}"]`
      );

      if (fallback && !fallback.disabled) {
        control = fallback;
      }
    }

    control?.focus();
  }

  private render(): void {
    // T-05: Filter input.
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

      this.render();

      // Keep focus in the filter input after updating the grid.
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

    // Pipeline 1: Filter.
    const filteredData = filterData(
      this.props.data,
      this.props.columns,
      this.filterQuery
    );

    // Pipeline 2: Sort.
    const sortedData = this.sortState
      ? sortData(
          filteredData,
          this.sortState.accessorKey,
          this.sortState.direction
        )
      : filteredData;

    // Pipeline 3: Calculate and clamp pagination.
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

    // Keep the active cell valid when results or pages change.
    if (
      displayedData.length === 0 ||
      this.props.columns.length === 0
    ) {
      this.activeCell = {
        rowIndex: 0,
        columnIndex: 0,
      };
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

    // Native HTML table and ARIA grid semantics.
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
      emptyCell.colSpan = Math.max(
        1,
        this.props.columns.length
      );

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

          // Roving tabindex: only one data cell is in the Tab order.
          cell.tabIndex =
            rowIndex === this.activeCell.rowIndex &&
            columnIndex === this.activeCell.columnIndex
              ? 0
              : -1;

          const value = item[column.accessorKey];

          // Render cell values as text, never as HTML.
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

    // Update active cell when reached by Tab or mouse focus.
    table.addEventListener("focusin", (event) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) return;

      const cell = target.closest<HTMLElement>(
        '[role="gridcell"][data-row-index][data-column-index]'
      );

      if (!cell) return;

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

    // T-06: Pagination controls.
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

    pagination.append(
      previousButton,
      pageIndicator,
      nextButton
    );

    // Live region for screen-reader announcements.
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.dataset.gridStatus = "";

    status.textContent = this.filterQuery.trim()
      ? `${filteredData.length} of ${this.props.data.length} rows match the filter. Page ${this.pageIndex + 1} of ${pageCount}.`
      : `${sortedData.length} rows available. Page ${this.pageIndex + 1} of ${pageCount}.`;

    this.root.replaceChildren(
      filterLabel,
      filterInput,
      table,
      pagination,
      status
    );
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
    onRowSelect: (item) => {
      // The selected row is also announced in the live region.
      console.info("Selected employee:", item.name);
    },
  });
}