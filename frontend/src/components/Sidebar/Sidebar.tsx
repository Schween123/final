import React from 'react';


interface SidebarProps {
  isOpen: boolean;
  togglePopup: () => void;
  handleNavigation: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, togglePopup, handleNavigation }) => {
  return (
    <div className={`fixed top-0 right-0 z-50 w-[200px] h-full bg-gray-800 text-white p-5 transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 md:hidden`}>
      <ul className="flex flex-col items-center justify-center h-full gap-y-4">
        <li><button onClick={togglePopup}>Cash Out</button></li>
        <li><button onClick={() => handleNavigation('/roominfo')}>Rooms</button></li>
        <li><button onClick={() => handleNavigation('/reportsummary')}>Report Summary</button></li>
        <li><button onClick={() => handleNavigation('/boarderregistration')}>New Boarder</button></li>
        <li><button onClick={() => handleNavigation('/optionpage')}>Log Out</button></li>
      </ul>
    </div>
  );
};

export default Sidebar;
