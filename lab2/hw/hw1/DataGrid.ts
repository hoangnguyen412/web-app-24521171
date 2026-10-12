
import type {
  ColumnDef,
  DataGridProps,
} from "./data-grid-contract";

let gridCounter = 0;

export class DataGrid<T extends object> {
  private readonly root: HTMLElement;
  private readonly props: DataGridProps<T>;
  private readonly instanceId: string;

  constructor(root: HTMLElement, props: DataGridProps<T>) {
    this.root = root;
    this.props = props;

    gridCounter += 1;
    this.instanceId = `data-grid-${gridCounter}`;

    this.render();
  }

  private render(): void {
    // Accessible filter label and input.
    const filterLabel = document.createElement("label");
    filterLabel.htmlFor = `${this.instanceId}-filter`;
    filterLabel.textContent = "Filter rows";

    const filterInput = document.createElement("input");
    filterInput.id = `${this.instanceId}-filter`;
    filterInput.type = "search";
    filterInput.name = "filter";

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
        headerCell.setAttribute("aria-sort", "none");

        const sortButton = document.createElement("button");
        sortButton.type = "button";
        sortButton.textContent = column.header;
        sortButton.setAttribute(
          "aria-label",
          `Sort by ${column.header}`
        );

        headerCell.appendChild(sortButton);
      } else {
        headerCell.textContent = column.header;
      }

      headerRow.appendChild(headerCell);
    });

    thead.appendChild(headerRow);

    // Render cell content as text, never as HTML.
    const tbody = document.createElement("tbody");

    if (this.props.data.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.setAttribute("role", "row");

      const emptyCell = document.createElement("td");
      emptyCell.setAttribute("role", "gridcell");
      emptyCell.colSpan = Math.max(1, this.props.columns.length);
      emptyCell.textContent = "No data available.";

      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      this.props.data.forEach((item) => {
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

    // Pagination controls; behaviour is added in T-06.
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

    // Status region; announcements are wired up in later tasks.
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = `${this.props.data.length} rows loaded.`;

    this.root.replaceChildren(
      filterLabel,
      filterInput,
      table,
      pagination,
      status
    );
  }
}

// Demo data for the assignment page.
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
  {
    header: "Department",
    accessorKey: "department",
    sortable: true,
  },
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
