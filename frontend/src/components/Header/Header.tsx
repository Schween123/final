import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Text, Img } from "./..";
import CashOutPopup from "../CashOutPopup/CashOutPopup";
import MenuIcon from "../MenuIcon/MenuIcon";
import Sidebar from "../Sidebar/Sidebar";

interface Props {
  className?: string;
}

export default function Header({ ...props }: Props) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const openPopup = () => setPopupOpen(true);
  const closePopup = () => setPopupOpen(false);
  const toggleMenu = () => setMenuOpen(!isMenuOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false); // Close the sidebar when an item is clicked
  };

  const handleButtonClick = () => {
    navigate("/dashboard"); // Adjust the path if needed
  };

  return (
    <>
      <header {...props} className={`${props.className} flex flex-col gap-2.5`}>
        <div className="flex items-center justify-between gap-5 self-stretch h-[90px] pl-[30px]">
          <button
            onClick={handleButtonClick}
            className="p-2 bg-transparent border-none cursor-pointer"
          >
            <Img
              src="public/images/logo.png"
              alt="logo"
              className="h-[75px] w-[75px] object-cover "
            />
          </button>
          <MenuIcon toggleMenu={toggleMenu} />
          <ul className="hidden md:flex flex-wrap items-center gap-[40px] justify-end w-full pr-[50px]">
            <li>
              <a href="#" onClick={openPopup}>
                <Text
                  as="p"
                  className="!font-opensans !text-cyan-800 !text-[17px]"
                >
                  Cash Out
                </Text>
              </a>
            </li>
            <li>
              <a href="#" onClick={() => handleNavigation("/roominfo")}>
                <Text
                  as="p"
                  className="!font-opensans !text-cyan-800 !text-[17px]"
                >
                  Rooms
                </Text>
              </a>
            </li>
            <li>
              <a href="#" onClick={() => handleNavigation("/reportsummary")}>
                <Text
                  as="p"
                  className="text-center !font-opensans !text-cyan-800 !text-[17px]"
                >
                  Report Summary
                </Text>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={() => handleNavigation("/gcashconfirmation")}
              >
                <Text
                  as="p"
                  className="text-center !font-opensans !text-cyan-800 !text-[17px]"
                >
                  Gcash Transactions
                </Text>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={() => handleNavigation("/boarderregistration")}
              >
                <Text
                  as="p"
                  className="text-center !font-opensans !text-cyan-800 !text-[17px]"
                >
                  New Boarder
                </Text>
              </a>
            </li>
            <li>
              <a href="#" onClick={() => handleNavigation("/splashscreen")}>
                <Text
                  as="p"
                  className="!font-opensans !text-cyan-800 !text-[17px]"
                >
                  Log Out
                </Text>
              </a>
            </li>
          </ul>
        </div>
        <div className="h-[2px] w-11/12 mx-auto bg-cyan-800 shadow-xs mt-[-10px]" />
      </header>
      <Sidebar
        isOpen={isMenuOpen}
        togglePopup={openPopup}
        handleNavigation={handleNavigation}
      />
      <CashOutPopup isOpen={isPopupOpen} onClose={closePopup} />
    </>
  );
}
