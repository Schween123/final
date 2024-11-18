import "./dashboard.css";

//insert navbar.tsx component

function DashboardElements() {
  return (
    <div className="dashboard-elements">
      <div className="heading">
        <div className="text-wrapper">Boarding House Name</div>
        <div className="div">DASHBOARD</div>
      </div>
 {/* supposed to be DashboardElements.tsx component*/}
      <div className="group">
        <div className="box">
          <div className="text-wrapper-2">BOARDERS</div>
          <div className="text-wrapper-3">00</div>
        </div>
        <div className="box-2">
          <div className="text-wrapper-4">
            PAID FOR <br />
            THE MONTH
          </div>
          <div className="text-wrapper-3">00</div>
        </div>
        <div className="box-3">
          <p className="text-wrapper-4">
            NOT YET PAID FOR <br />
            THE MONTH
          </p>
          <div className="text-wrapper-3">00</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardElements