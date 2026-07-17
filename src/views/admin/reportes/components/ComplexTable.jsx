import CardMenu from "components/card/CardMenu";
import Card from "components/card";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";
import { MdCheckCircle, MdCancel, MdOutlineError } from "react-icons/md";
import { useMemo } from "react";
import Progress from "components/progress";

// Icono por estado para la columna STATUS
const STATUS_ICONS = {
  Approved: <MdCheckCircle className="text-green-500" />,
  Disable: <MdCancel className="text-red-500" />,
  Error: <MdOutlineError className="text-orange-500" />,
};

const ComplexTable = (props) => {
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
  initialState.pageSize = 5;

  return (
    <Card extra={"w-full h-full px-6 pb-6 sm:overflow-x-auto"}>
      <div className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          Complex Table
        </div>
        <CardMenu />
      </div>

      <div className="mt-8 overflow-x-scroll xl:overflow-hidden">
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
                        key={columnKey}
                        className="border-b border-gray-200 pr-28 pb-[10px] text-start dark:!border-navy-700"
                      >
                        <p className="text-xs tracking-wide text-gray-600">
                          {column.render("Header")}
                        </p>
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
                    if (
                      cell.column.Header === "NAME" ||
                      cell.column.Header === "DATE"
                    ) {
                      data = (
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "STATUS") {
                      data = (
                        <div className="flex items-center gap-2">
                          <div className={`rounded-full text-xl`}>
                            {STATUS_ICONS[cell.value] ?? null}
                          </div>
                          <p className="text-sm font-bold text-navy-700 dark:text-white">
                            {cell.value}
                          </p>
                        </div>
                      );
                    } else if (cell.column.Header === "PROGRESS") {
                      data = <Progress width="w-[108px]" value={cell.value} />;
                    }
                    return (
                      <td
                        className="pt-[14px] pb-[18px] sm:text-[14px]"
                        {...cellProps}
                        key={cellKey}
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

export default ComplexTable;
