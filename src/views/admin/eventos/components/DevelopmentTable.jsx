import React, { useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";
import { IoEnterOutline } from "react-icons/io5";
import { MdAdd, MdContentCopy, MdSearch } from "react-icons/md";
import Card from "components/card";

const PAGINATION_STORAGE_KEY = "EVENTFLOW.events.pagination";

const DevelopmentTable = (props) => {
  const { columnsData, tableData, onDuplicate, duplicating } = props;
  const navigate = useNavigate();

  const columns = useMemo(() => columnsData, [columnsData]);
  const data = useMemo(() => tableData, [tableData]);

  // Obtener el estado de paginación guardado
  const savedPageIndex = useMemo(() => {
    const saved = sessionStorage.getItem(PAGINATION_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  }, []);

  const tableInstance = useTable(
    {
      columns,
      data,
      disableSortRemove: true,
      initialState: {
        pageIndex: savedPageIndex, // Restaurar página guardada
        pageSize: 10,
        sortBy: [
          {
            id: "update_date",
            desc: true
          },
        ],
      },
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
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = tableInstance;

  // Guardar el estado de paginación cada vez que cambie
  useEffect(() => {
    sessionStorage.setItem(PAGINATION_STORAGE_KEY, pageIndex.toString());
  }, [pageIndex]);

  // Limpiar paginación al crear nuevo evento
  const handleCreateEvent = () => {
    sessionStorage.removeItem(PAGINATION_STORAGE_KEY);
  };

  return (
    <Card extra={"w-full h-full p-4"}>
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          Tabla de Eventos
        </div>
        <div className="flex items-center gap-3">
          {/* Buscador de eventos */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-lightPrimary px-3 py-[10px] dark:!border-navy-700 dark:!bg-navy-900">
            <MdSearch className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={globalFilter || ""}
              onChange={(e) => {
                setGlobalFilter(e.target.value || undefined);
                gotoPage(0);
              }}
              placeholder="Buscar evento..."
              className="bg-transparent text-sm text-navy-700 outline-none placeholder:text-gray-500 dark:text-white"
            />
          </div>
          <Link className="hover:no-underline" to="crear" onClick={handleCreateEvent}>
            <button className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Evento <MdAdd className="h-5 w-5" />
            </button>
          </Link>
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
                    className="border-b border-gray-200 pr-32 pb-[10px] text-start dark:!border-navy-700 "
                    key={index}
                  >
                    <div className="text-sm font-bold tracking-wide text-gray-600">
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
                  className="border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                  {...row.getRowProps()}
                  key={index}
                  onClick={() => {
                    navigate(`${row.original.action}/detalle/`);
                    localStorage.setItem(`EVENTFLOW.event`, JSON.stringify(row.original.model));
                  }}
                >
                  {row.cells.map((cell, index) => {
                    let data = "";
                    if (cell.column.Header === "TITULO") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "FECHA DEL EVENTO") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "EDITAR") {
                      data = (
                        <span
                          onClick={() => {
                            navigate(`${cell.value}/detalle/`);
                            localStorage.setItem(
                              `EVENTFLOW.event`,
                              JSON.stringify(cell.row.original.model)
                            );
                          }}
                          className="flex items-center gap-2 text-[15px] cursor-pointer hover:text-brand-500"
                        >
                          Ingresar <IoEnterOutline className="text-brand-500 hover:text-black transition" />
                        </span>
                      );
                    } else if (cell.column.Header === "ACCIONES") {
                      const isDuplicating = duplicating === cell.value;
                      data = (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDuplicate && !isDuplicating) {
                              onDuplicate(cell.value);
                            }
                          }}
                          disabled={isDuplicating}
                          className={`flex items-center gap-2 text-[15px] focus:outline-none px-3 py-2 rounded-lg transition ${
                            isDuplicating
                              ? 'text-gray-500 cursor-not-allowed'
                              : 'text-black hover:text-blue-500 cursor-pointer'
                          }`}
                          title="Duplicar evento"
                        >
                          {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                          <MdContentCopy
                          className={`cursor-pointer transition-transform duration-200 
                          hover:scale-110 fill-blue-500
                          ${isDuplicating ? 'animate-pulse' : ''}`}
                        />
                        </button>
                      );
                    }
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={index}
                        className="px-2 pt-[14px] pb-3 text-[14px]"
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
        <button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="px-4 py-2 text-sm font-medium bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página{" "}
          <strong>
            {pageIndex + 1} de {pageOptions.length}
          </strong>
        </span>
        <button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          className="px-4 py-2 text-sm font-medium bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </Card>
  );
};

export default DevelopmentTable;
