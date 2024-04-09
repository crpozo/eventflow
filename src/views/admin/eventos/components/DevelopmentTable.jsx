import Card from "components/card";
import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";
import { IoEnterOutline } from "react-icons/io5";
import {
  MdAdd,
} from "react-icons/md";

const DevelopmentTable = (props) => {
  const { columnsData, tableData } = props;
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
  } = tableInstance;
  initialState.pageSize = 11;

  return (
    <Card extra={"w-full h-full p-4"}>
      <div className="relative flex items-center justify-between">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          Tabla de Eventos
        </div>
        <Link className="hover:no-underline" to="crear">
          <button className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
            Crear Evento <MdAdd className="h-5 w-5" />
          </button>
        </Link>
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
                <tr  className="border-b border-gray-200" {...row.getRowProps()} key={index}>
                  {row.cells.map((cell, index) => {
                    let data = "";
                    if (cell.column.Header === "TITULO") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "CREACION") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    }
                    else if (cell.column.Header === "EDITAR") {
                      data = (
                        <span
                          onClick={() => {
                            navigate(`${cell.value}/detalle/`);
                            localStorage.setItem(`EVENTFLOW.event`, JSON.stringify(cell.row.original.model));
                          }}
                          className="flex items-center gap-2 text-[15px] cursor-pointer hover:text-brand-500" 
                          style={{ /* Add your inline styles here */ }}
                        >
                          Ingresar  <IoEnterOutline className="h-[20px] w-[20px]"/>
                        </span>
                      );
                    }
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={index}
                        className="pt-[14px] pb-3 text-[14px]"
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

export default DevelopmentTable;
