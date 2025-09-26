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
import UploadExcelButton from "./UploadExcelButton";

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
      <div className="relative flex items-center ">
        <div className="w-full flex flex-row justify-between">
          <div className="text-2xl font-medium text-navy-700 dark:text-white">
            Tabla de participantes
          </div>
          <div>
            <UploadExcelButton />
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
                  className="border-b border-gray-200"
                  {...row.getRowProps()}
                  key={index} 
                >
                  {row.cells.map((cell, index) => {
                    let data = "";
                    if (cell.column.Header === "ID") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    } else if (cell.column.Header === "Creacion") {
                      data = (
                        <p className="text-[15px] text-navy-700 dark:text-white">
                          {cell.value}
                        </p>
                      );
                    }
                    // } else if (cell.column.Header === "Detalle") {
                    //   data = (
                    //     <span
                    //       onClick={() => {
                    //         navigate(`/usuario/${cell.value}`);
                    //       }}
                    //       className="flex cursor-pointer items-center gap-2 hover:text-brand-500"
                    //       style={
                    //         {
                    //           /* Add your inline styles here */
                    //         }
                    //       }
                    //     >
                    //       Ingresar{" "}
                    //       <IoEnterOutline className="h-[20px] w-[20px]" />
                    //     </span>
                    //   );
                    // }
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={index}
                        className="pb-3 pt-[14px] text-[14px]"
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
