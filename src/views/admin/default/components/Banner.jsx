
const Banner1 = () => {
  return (
    <div
      className="flex w-full items-center justify-center flex-col rounded-[20px] bg-cover px-[30px] py-[30px] mb-5 md:px-[34px] md:py-[76px]"
      style={{ background: `#FFF000` }}
    >
      <div className="w-full">
        <h4 className="mb-[14px] max-w-full text-xl font-black text-navy-700 md:w-[64%] md:text-5xl md:leading-[42px] lg:w-[46%] xl:w-[85%] 2xl:w-[75%] 3xl:w-[52%]">
          Dashboard
        </h4>
        <p className="max-w-full text-lg text-navy-700 font-bold text-[#E3DAFF] md:text-2xl md:w-[64%] lg:w-[40%] xl:w-[72%] 2xl:w-[60%] 3xl:w-[45%]">
          Campus - Area - SubArea
        </p>
      </div>
    </div>
  );
};

export default Banner1;
