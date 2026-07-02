import { Card, TYPE } from "components/adminUi";
import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

import { IoEnterOutline } from "react-icons/io5";
import { MdDownload } from "react-icons/md";
import UploadExcelButton from "./UploadExcelButton";
import DownloadBadgeButton from "./DownloadBadgeButton";
import DeleteParticipantButton from "./DeleteParticipantButton";
import DownloadAllBadgesButton from "./DownloadAllBadgesButton";

const DevelopmentTable = (props) => {
  const { columnsData, tableData, event, canEdit = true } = props;

  const navigate = useNavigate();

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
          <h3 className="text-base font-bold text-navy-700 dark:text-white">
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
          variant="simple"
          color="gray-500"
          mb="24px"
        >
          <thead>
            {headerGroups.map((headerGroup, index) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                {headerGroup.headers.map((column, index) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="border-b border-gray-200 pb-[10px] pr-32 text-start dark:!border-navy-700 "
                    key={index}
                  >
                    <div className={TYPE.th}>
                      {column.render("Header")}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, index) => {
              prepareRow(row);
              return (
                <tr
                  className="border-b border-gray-200"
                  {...row.getRowProps()}
                  key={index} 
                >
                  {row.cells.map((cell, index) => {
                    let data = "";
                    if (cell.column.Header === "Email") {
                      data = (
                        <p className={TYPE.td}>
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "Creacion") {
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
                        {...cell.getCellProps()}
                        key={index}
                        className="pb-3 pt-[14px] text-sm"
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
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'<<'}
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'<'}
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'>'}
          </button>
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            className="rounded bg-gray-200 px-3 py-1 text-sm disabled:opacity-50"
          >
            {'>>'}
          </button>
        </div>
        <span className="text-sm text-gray-700">
          Página{' '}
          <strong>
            {pageIndex + 1} de {pageOptions.length}
          </strong>{' '}
        </span>
        <span className="text-sm text-gray-700">
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
