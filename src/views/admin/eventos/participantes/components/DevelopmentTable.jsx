import { Card, TYPE } from "components/adminUi";
import React, { useMemo } from "react";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

import UploadExcelButton from "./UploadExcelButton";
import DownloadBadgeButton from "./DownloadBadgeButton";
import DeleteParticipantButton from "./DeleteParticipantButton";
import DownloadAllBadgesButton from "./DownloadAllBadgesButton";

const DevelopmentTable = (props) => {
  const { columnsData, tableData, event, canEdit = true } = props;

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
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;
  initialState.pageSize = 50;

  return (
    <Card className="w-full h-full">
      <div className="relative flex items-center ">
        <div className="w-full flex flex-row justify-between">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">
            Tabla de participantes
          </h3>
          <div className="flex gap-2">
            <DownloadAllBadgesButton event={event} tableData={tableData} />
            {canEdit && <UploadExcelButton event={event} />}
          </div>
        </div>
      </div>

      <div className="h-full overflow-x-scroll xl:overflow-x-hidden">
        <table
          {...getTableProps()}
          className="mt-8 h-max w-full"
          color="gray-500"
        >
          <thead>
            {headerGroups.map((headerGroup) => {
              // react-table incluye una key estable en sus prop getters
              const { key: headerGroupKey, ...headerGroupProps } =
                headerGroup.getHeaderGroupProps();
              return (
                <tr {...headerGroupProps} key={headerGroupKey}>
                  {headerGroup.headers.map((column) => {
                    const { key: headerKey, ...headerProps } =
                      column.getHeaderProps(column.getSortByToggleProps());
                    return (
                      <th
                        {...headerProps}
                        className="border-b border-gray-200 pb-[10px] pr-32 text-start dark:!border-navy-700 "
                        key={headerKey}
                      >
                        <div className={TYPE.th}>
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
                <tr
                  className="border-b border-gray-200"
                  {...rowProps}
                  key={rowKey}
                >
                  {row.cells.map((cell) => {
                    const { key: cellKey, ...cellProps } = cell.getCellProps();
                    let data = "";
                    if (
                      cell.column.Header === "Email" ||
                      cell.column.Header === "Creacion"
                    ) {
                      data = (
                        <p className={TYPE.td}>
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "Acciones") {
                      data = (
                        <div className="flex gap-2">
                          <DownloadBadgeButton
                            eventAttendee={row.original.eventAttendee}
                            event={event}
                          />
                          {canEdit && (
                            <DeleteParticipantButton
                              eventAttendee={row.original.eventAttendee}
                            />
                          )}
                        </div>
                      );
                    }
                    return (
                      <td
                        {...cellProps}
                        key={cellKey}
                        className="py-2.5 text-base"
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

      {/* Controles de paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'<<'}
          </button>
          <button
            type="button"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'<'}
          </button>
          <button
            type="button"
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'>'}
          </button>
          <button
            type="button"
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'>>'}
          </button>
        </div>
        <span className="text-sm text-navy-700 dark:text-gray-200">
          Página{' '}
          <strong>
            {pageIndex + 1} de {pageOptions.length}
          </strong>{' '}
        </span>
        <span className="text-sm text-navy-700 dark:text-gray-200">
          | Mostrando {page.length} de {data.length} participantes
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {[10, 20, 30, 50, 100].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
};

export default DevelopmentTable;
