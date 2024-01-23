import Card from "components/card";

const Widget = ({ icon, title, subtitle, description }) => {
  return (
    <Card extra="!flex-row flex-grow items-center rounded-[20px]">
      <div className="ml-[18px] flex h-[90px] w-auto flex-row items-center">
        <div className="rounded-full bg-lightPrimary p-3 dark:bg-navy-700">
          <span className="flex items-center text-brand-500 dark:text-white">
            {icon}
          </span>
        </div>
      </div>

      <div className="h-50 ml-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-lg font-medium text-gray-600">{title}</p>
        <h4 className="text-2xl font-medium text-navy-700 dark:text-white">
          {subtitle} <span className="font-normal text-base">{description}</span>
        </h4>
      </div>
    </Card>
  );
};

export default Widget;
