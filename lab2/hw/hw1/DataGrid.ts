import type {
  ColumnDef,
  DataGridProps,
} from "./data-grid-contract";

type SortDirection = "ascending" | "descending";

interface SortState<T> {
  accessorKey: keyof T;
  direction: SortDirection;
}

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

// Pure function: sort without mutating the original array.
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

// Pure function: filter across columns without mutating input data.
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

  constructor(root: HTMLElement, props: DataGridProps<T>) {
    this.root = root;
    this.props = props;

    gridCounter += 1;
    this.instanceId = `data-grid-${gridCounter}`;

    this.render();
  }

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

    this.render();
  }

  private render(): void {
    // Filter control.
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

      // Restore focus and cursor after rendering.
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

    // Filter -> Sort. Pagination will be added in T-06.
    const query = this.filterQuery.trim().toLocaleLowerCase();

    const filteredData = filterData(
      this.props.data,
      this.props.columns,
      query
    );

    const displayedData = this.sortState
      ? sortData(
          filteredData,
          this.sortState.accessorKey,
          this.sortState.direction
        )
      : filteredData;

    // Native table with ARIA grid semantics.
    const table = document.createElement("table");
    table.setAttribute("role", "grid");
    table.setAttribute("aria-label", this.props.ariaLabel);

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

    // Table body.
    const tbody = document.createElement("tbody");

    if (displayedData.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.setAttribute("role", "row");

      const emptyCell = document.createElement("td");
      emptyCell.setAttribute("role", "gridcell");
      emptyCell.colSpan = Math.max(1, this.props.columns.length);

      emptyCell.textContent = query
        ? "No rows match your filter."
        : "No data available.";

      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      displayedData.forEach((item) => {
        const row = document.createElement("tr");
        row.setAttribute("role", "row");

        this.props.columns.forEach((column, index) => {
          const cell = document.createElement("td");
          cell.setAttribute("role", "gridcell");
          cell.setAttribute("headers", headerIds[index]);

          const value = item[column.accessorKey];

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

    // Pagination controls; functionality will be added in T-06.
    const pagination = document.createElement("nav");
    pagination.setAttribute("aria-label", "Table pagination");

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.textContent = "Previous";
    previousButton.disabled = true;

    const pageIndicator = document.createElement("p");
    pageIndicator.textContent = "Page 1 of 1";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "Next";
    nextButton.disabled = true;

    pagination.append(
      previousButton,
      pageIndicator,
      nextButton
    );

    // Announce the current filter results.
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    status.textContent = query
      ? `${displayedData.length} of ${this.props.data.length} rows match the filter.`
      : `${this.props.data.length} rows loaded.`;

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
  });
}