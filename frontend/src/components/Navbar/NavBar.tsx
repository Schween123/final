
import "./navbar.css";

function NavBar(){
  return (
    <div className="navbar">
      <img className="logo" alt="Logo" src="src\assets\logo.png" />
      <div className="frame">
        <div className="text-wrapper">Cash Out</div>
        <div className="div">Rooms</div>
        <div className="text-wrapper-2">
          Report <br />
          Summary
        </div>
        <div className="text-wrapper-2">
          New <br />
          Boarder
        </div>
        <div className="div">Log Out</div>
      </div>
      <img className="line" alt="Line" src="line-1.svg" />
    </div>
  );
};

export default NavBar;