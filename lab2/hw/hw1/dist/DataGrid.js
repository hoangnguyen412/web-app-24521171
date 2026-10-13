const PAGE_SIZE = 3;
// Compare numbers numerically and other values as text.
function compareValues(left, right) {
    if (left == null)
        return right == null ? 0 : 1;
    if (right == null)
        return -1;
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    return String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: "base",
    });
}
// T-04: Pure sorting function. Does not mutate the input array.
export function sortData(data, accessorKey, direction) {
    return data
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
        const result = compareValues(a.item[accessorKey], b.item[accessorKey]);
        if (result === 0) {
            return a.index - b.index;
        }
        return direction === "ascending" ? result : -result;
    })
        .map(({ item }) => item);
}
// T-05: Pure filtering function across all configured columns.
export function filterData(data, columns, query) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
        return [...data];
    }
    return data.filter((item) => columns.some((column) => {
        const value = item[column.accessorKey];
        return String(value ?? "")
            .toLocaleLowerCase()
            .includes(normalizedQuery);
    }));
}
let gridCounter = 0;
export class DataGrid {
    constructor(root, props) {
        this.sortState = null;
        this.filterQuery = "";
        this.pageIndex = 0;
        this.root = root;
        this.props = props;
        gridCounter += 1;
        this.instanceId = `data-grid-${gridCounter}`;
        this.render();
    }
    // T-04: Cycle none -> ascending -> descending -> none.
    toggleSort(column) {
        if (!column.sortable)
            return;
        if (this.sortState?.accessorKey !== column.accessorKey) {
            this.sortState = {
                accessorKey: column.accessorKey,
                direction: "ascending",
            };
        }
        else if (this.sortState.direction === "ascending") {
            this.sortState = {
                accessorKey: column.accessorKey,
                direction: "descending",
            };
        }
        else {
            this.sortState = null;
        }
        this.render();
    }
    // T-06: Change pages and keep the index within valid bounds.
    changePage(nextPage, pageCount) {
        this.pageIndex = Math.max(0, Math.min(nextPage, pageCount - 1));
        this.render();
    }
    render() {
        // Filter input and its visible label.
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
            // Render updates the result list and clamps the current page.
            this.render();
            const updatedInput = this.root.querySelector(`#${this.instanceId}-filter`);
            updatedInput?.focus();
            if (updatedInput && cursorPosition !== null) {
                const position = Math.min(cursorPosition, updatedInput.value.length);
                updatedInput.setSelectionRange(position, position);
            }
        });
        // T-05: Filter first.
        const filteredData = filterData(this.props.data, this.props.columns, this.filterQuery);
        // T-04: Sort the filtered results second.
        const sortedData = this.sortState
            ? sortData(filteredData, this.sortState.accessorKey, this.sortState.direction)
            : filteredData;
        // T-06: Calculate the number of pages.
        // Empty results still use the logical page "1 of 1".
        const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
        // Clamp the page if filtering reduces the number of results.
        this.pageIndex = Math.max(0, Math.min(this.pageIndex, pageCount - 1));
        // T-06: Paginate the filtered and sorted results.
        const startIndex = this.pageIndex * PAGE_SIZE;
        const displayedData = sortedData.slice(startIndex, startIndex + PAGE_SIZE);
        // Native table with ARIA grid semantics.
        const table = document.createElement("table");
        table.setAttribute("role", "grid");
        table.setAttribute("aria-label", this.props.ariaLabel);
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.setAttribute("role", "row");
        const headerIds = this.props.columns.map((_, index) => `${this.instanceId}-column-${index}`);
        this.props.columns.forEach((column, index) => {
            const headerCell = document.createElement("th");
            headerCell.scope = "col";
            headerCell.id = headerIds[index];
            headerCell.setAttribute("role", "columnheader");
            if (column.sortable) {
                const isActive = this.sortState?.accessorKey === column.accessorKey;
                const direction = isActive
                    ? this.sortState.direction
                    : "none";
                headerCell.setAttribute("aria-sort", direction);
                const sortButton = document.createElement("button");
                sortButton.type = "button";
                const indicator = direction === "ascending"
                    ? "▲"
                    : direction === "descending"
                        ? "▼"
                        : "↕";
                sortButton.textContent = `${column.header} ${indicator}`;
                sortButton.setAttribute("aria-label", `Sort by ${column.header}. Current order: ${direction}.`);
                sortButton.addEventListener("click", () => {
                    this.toggleSort(column);
                });
                headerCell.appendChild(sortButton);
            }
            else {
                headerCell.textContent = column.header;
            }
            headerRow.appendChild(headerCell);
        });
        thead.appendChild(headerRow);
        // Render only the rows belonging to the current page.
        const tbody = document.createElement("tbody");
        if (displayedData.length === 0) {
            const emptyRow = document.createElement("tr");
            emptyRow.setAttribute("role", "row");
            const emptyCell = document.createElement("td");
            emptyCell.setAttribute("role", "gridcell");
            emptyCell.colSpan = Math.max(1, this.props.columns.length);
            emptyCell.textContent = this.filterQuery.trim()
                ? "No rows match your filter."
                : "No data available.";
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }
        else {
            displayedData.forEach((item) => {
                const row = document.createElement("tr");
                row.setAttribute("role", "row");
                this.props.columns.forEach((column, index) => {
                    const cell = document.createElement("td");
                    cell.setAttribute("role", "gridcell");
                    cell.setAttribute("headers", headerIds[index]);
                    const value = item[column.accessorKey];
                    // Render values as text, never as HTML.
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
        // T-06: Pagination controls.
        const pagination = document.createElement("nav");
        pagination.setAttribute("aria-label", "Table pagination");
        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.textContent = "Previous";
        previousButton.disabled = this.pageIndex === 0;
        previousButton.addEventListener("click", () => {
            this.changePage(this.pageIndex - 1, pageCount);
        });
        const pageIndicator = document.createElement("p");
        pageIndicator.textContent =
            `Page ${this.pageIndex + 1} of ${pageCount}`;
        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next";
        nextButton.disabled = this.pageIndex >= pageCount - 1;
        nextButton.addEventListener("click", () => {
            this.changePage(this.pageIndex + 1, pageCount);
        });
        pagination.append(previousButton, pageIndicator, nextButton);
        // Live status for screen readers.
        const status = document.createElement("p");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.textContent = this.filterQuery.trim()
            ? `${filteredData.length} of ${this.props.data.length} rows match the filter. Page ${this.pageIndex + 1} of ${pageCount}.`
            : `${sortedData.length} rows available. Page ${this.pageIndex + 1} of ${pageCount}.`;
        this.root.replaceChildren(filterLabel, filterInput, table, pagination, status);
    }
}
const employees = [
    { id: 1, name: "An Nguyen", department: "IT", status: "Active" },
    { id: 2, name: "Binh Tran", department: "HR", status: "Active" },
    { id: 3, name: "Chi Le", department: "Finance", status: "Inactive" },
    { id: 4, name: "Dung Pham", department: "IT", status: "Active" },
];
const columns = [
    { header: "ID", accessorKey: "id", sortable: true },
    { header: "Name", accessorKey: "name", sortable: true },
    { header: "Department", accessorKey: "department", sortable: true },
    { header: "Status", accessorKey: "status", sortable: true },
];
const root = document.getElementById("data-grid-root");
if (root) {
    new DataGrid(root, {
        data: employees,
        columns,
        ariaLabel: "Employee data",
    });
}
