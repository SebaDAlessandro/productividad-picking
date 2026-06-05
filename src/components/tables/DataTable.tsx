import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../ui/Field";

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Buscar",
}: {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="grid gap-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 text-[color:var(--brand-muted)]" size={18} />
        <Input
          className="w-full pl-10"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-[color:var(--brand-border)]">
        <table className="min-w-full divide-y divide-[color:var(--brand-border)] text-sm [&_td:last-child]:text-center [&_th:last-child]:text-center">
          <thead className="bg-[color:var(--brand-panel)]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-5 py-4 text-left align-middle font-semibold"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[color:var(--brand-panel)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-5 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
