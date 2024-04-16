
const Banner1 = () => {
  return (
    <div
      className="flex w-full relative items-center justify-center flex-col rounded-[20px] bg-cover px-[30px] py-[30px] mb-[32px] md:px-[34px] md:py-[70px]"
      style={{ background: `#faf3e9f7` }}
    >
      <div className="w-full">
        <h4 className="max-w-full text-xl font-bold text-navy-700 md:w-[64%] md:text-[55px] md:leading-[42px] lg:w-[46%] xl:w-[85%] 2xl:w-[75%] 3xl:w-[52%]">
          Eventos
        </h4>
        <svg className="pill hidden md:block" width="178" height="170" viewBox="0 0 178 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M106.813 184.32L182.553 105.916C206.413 81.216 205.813 41.7716 181.212 17.8147C156.611 -6.14219 117.325 -5.53962 93.4646 19.1606L17.7252 97.5649C-6.13549 122.265 -5.53535 161.709 19.0656 185.666C43.6666 209.623 82.9525 209.021 106.813 184.32Z" fill="#4A4B4C"/>
        </svg>
      </div>
    </div>
  );
};

export default Banner1;
