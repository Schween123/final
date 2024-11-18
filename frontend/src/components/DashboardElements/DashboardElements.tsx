

function DashboardElements() {
  return (
    <div className="flex flex-col items-start pr-14 max-md:pr-5">
      <div className="text-5xl leading-8 text-zinc-700 max-md:max-w-full max-md:text-4xl">
        Boarding House Name
      </div>
      <div className="mt-5 text-3xl leading-8 text-slate-600 max-md:max-w-full">
        DASHBOARD
      </div>
      <div className="self-center mt-40 w-full max-w-[1195px] max-md:mt-10 max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col max-md:gap-0">
          <div className="flex flex-col w-[33%] max-md:ml-0 max-md:w-full">
            <div className="flex flex-col grow px-16 py-3 w-full text-white whitespace-nowrap rounded-3xl bg-slate-600 max-md:px-5 max-md:mt-10">
              <div className="text-3xl leading-8">BOARDERS</div>
              <div className="self-center mt-24 text-7xl leading-8 max-md:mt-10 max-md:text-4xl">
                00
              </div>
            </div>
          </div>
          <div className="flex flex-col ml-5 w-[33%] max-md:ml-0 max-md:w-full">
            <div className="flex flex-col grow px-16 py-4 w-full text-white rounded-3xl bg-slate-600 max-md:px-5 max-md:mt-10">
              <div className="text-3xl leading-8 text-center">
                PAID FOR <br />
                THE MONTH
              </div>
              <div className="self-center mt-16 text-7xl leading-8 max-md:mt-10 max-md:text-4xl">
                00
              </div>
            </div>
          </div>
          <div className="flex flex-col ml-5 w-[33%] max-md:ml-0 max-md:w-full">
            <div className="flex flex-col grow px-3.5 py-5 w-full text-white rounded-3xl bg-slate-600 max-md:mt-10">
              <div className="text-3xl leading-8 text-center">
                NOT YET PAID FOR <br />
                THE MONTH
              </div>
              <div className="self-center mt-14 text-7xl leading-8 max-md:mt-10 max-md:text-4xl">
                00
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardElements;

