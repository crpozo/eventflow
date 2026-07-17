import React, { useMemo } from "react";
import CardMenu from "components/card/CardMenu";
import Checkbox from "components/checkbox";
import Card from "components/card";

import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

const CheckTable = (props) => {
  const { columnsData, tableData } = props;

  const columns = useMemo(() => columnsData, [columnsData]);
  const data = useMemo(() => tableData, [tableData]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    initialState,
  } = tableInstance;
  initialState.pageSize = 11;

  return (
    <Card extra={"w-full h-full sm:overflow-auto px-6"}>
      <header className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          Check Table
        </div>

        <CardMenu />
      </header>

      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table {...getTableProps()} className="w-full">
          <thead>
            {headerGroups.map((headerGroup) => {
              // react-table provee keys estables derivadas de las columnas
              const { key: headerGroupKey, ...headerGroupProps } =
                headerGroup.getHeaderGroupProps();
              return (
                <tr {...headerGroupProps} key={headerGroupKey}>
                  {headerGroup.headers.map((column) => {
                    const { key: columnKey, ...columnProps } =
                      column.getHeaderProps(column.getSortByToggleProps());
                    return (
                      <th
                        {...columnProps}
                        className="border-b border-gray-200 pr-16 pb-[10px] text-start dark:!border-navy-700"
                        key={columnKey}
                      >
                        <div className="text-xs font-bold tracking-wide text-gray-600 lg:text-xs">
                          {column.render("Header")}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              const { key: rowKey, ...rowProps } = row.getRowProps();
              return (
                <tr {...rowProps} key={rowKey}>
                  {row.cells.map((cell) => {
                    const { key: cellKey, ...cellProps } = cell.getCellProps();
                    let data = "";
                    if (cell.column.Header === "NAME") {
                      data = (
                        <div className="flex items-center gap-2">
                          <Checkbox />
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {cell.value[0]}
                          </p>
                        </div>
                      );
                    } else if (cell.column.Header === "PROGRESS") {
                      data = (
                        <div className="flex items-center">
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {cell.value}%
                          </p>
                        </div>
                      );
                    } else if (cell.column.Header === "QUANTITY") {
                      data = (
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                          {" "}
                          {cell.value}{" "}
                        </p>
                      );
                    } else if (cell.column.Header === "DATE") {
                      data = (
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    }
                    return (
                      <td
                        {...cellProps}
                        key={cellKey}
                        className="pt-[14px] pb-[16px] sm:text-[14px]"
                      >
                        {data}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default CheckTable;
