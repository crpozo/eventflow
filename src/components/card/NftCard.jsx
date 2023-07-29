import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { useState } from "react";
import Card from "components/card";

const NftCard = ({ title, author, cat, color}) => {
  const [heart, setHeart] = useState(true);
  return (
    <Card
      extra={`flex flex-col w-full h-full p-0 bg-white  border border-gray-600`}
    >
      <div className="h-full w-full">
        <div className="relative w-full">
          <div className={`h-[50px] w-full rounded-t-md ${color}`}></div>
        </div>
              
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start 3xl:flex-row 3xl:justify-between">
            <div className="mb-2">
              <p className="text-lg font-bold text-navy-700 dark:text-white">
                {" "}
                {title}{" "}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-600 md:mt-2">
                22/01/1995
              </p>
            </div>

          </div>

          <div className="flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col 2xl:items-start 3xl:flex-row 3xl:items-center 3xl:justify-between">
            <div className="flex">

            </div>
            <button
              href=""
              className="linear rounded-md bg-transparent px-4 py-2 text-base font-medium transition duration-200 border border-gray-600  hover:!bg-brand-500 hover:text-white active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:opacity-90"
            >
              {cat}
            </button>
          </div>

        </div>

      </div>
    </Card>
  );
};

export default NftCard;
