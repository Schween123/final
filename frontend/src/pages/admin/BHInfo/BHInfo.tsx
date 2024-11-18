import { Helmet } from "react-helmet";
import { Button, Heading } from "../../../components";
import BHInfoRoom from "../../../components/BHInfoRoom/bhInfoRoom.tsx";
import { Suspense, useState, useEffect } from 'react';
import DoneBHRegistration from "../../../components/DoneBHRegistration/DoneBHRegistration.tsx";
import { useLocation } from 'react-router-dom';
import Keyboard from "../../../components/Keyboard/Keyboard"; // Import keyboard

const globalStyles = `
  body, html {
    background-color: #C5C3C6;
    height: 100%;
    margin: 0;
  }
  #root, .app {
    height: 100%;
  }
`;

interface RoomData {
  roomnumber: string;
  capacity: number;
}

interface BoardingHouse {
  id: number;
  bhname: string;
  bhaddress: string;
}


export default function BHInfoPage() {
  const location = useLocation();
  const { bhrooms, boardingHouseId } = location.state || { bhrooms: 0, boardingHouseId: null };
  const [showPopup, setShowPopup] = useState(false);
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentField, setCurrentField] = useState<{ index: number, field: keyof RoomData } | null>(null);
    const [boardingHouse, setBoardingHouse] = useState<BoardingHouse | null>(
    null
  );

  useEffect(() => {
    const rooms: RoomData[] = Array.from({ length: bhrooms }, (_, index) => ({
      roomnumber: `Room ${index + 1}`,
      capacity: 0,
    }));
    setRoomData(rooms);
  }, [bhrooms]);
  
     const fetchBoardingHouseInfo = async (boardingHouseId: number) => {
        try {
          const response = await axios.get<BoardingHouse>(
            `http://127.0.0.1:8000/api/boardinghouse/${boardingHouseId}/`
          );
          setBoardingHouse(response.data);
        } catch (error) {
          console.error("Error fetching boarding house info:", error);
        }
      };

  useEffect(() => {
    const fetchData = async () => {
      if (boardingHouseId) {
        await fetchBoardingHouseInfo(boardingHouseId);
      }
    };

    fetchData();
  }, [boardingHouseId]);


      const handleDoneClick = async () => {
    const hasZeroCapacity = roomData.some((room) => room.capacity <= 0);
    if (hasZeroCapacity) {
      alert('Please ensure all rooms have a capacity greater than zero.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rooms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          roomData.map((room) => ({
            room_number: room.roomnumber,
            capacity: room.capacity,
            boarding_house: boardingHouseId,
          }))
        ),
      });

      if (response.ok) {
        const responseData = await response.json();
        setShowPopup(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to save room data:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const updateRoomData = (index: number, field: keyof RoomData, value: string) => {
    const newRoomData = [...roomData];
    if (field === "capacity") {
      const numericValue = Number(value);
      newRoomData[index][field] = isNaN(numericValue) ? 0 : numericValue;
    } else if (field === "roomnumber") {
      newRoomData[index][field] = value;
    }
    setRoomData(newRoomData);
  };

  const handleInputClick = (index: number, field: keyof RoomData) => {
    setCurrentField({ index, field });
    setKeyboardVisible(true);
  };

  const handleKeyPress = (key: string) => {
    if (currentField) {
      const { index, field } = currentField;
      let updatedValue = roomData[index][field].toString();

      if (key === 'Backspace') {
        updatedValue = updatedValue.slice(0, -1);
      } else if (key === 'Enter') {
        setKeyboardVisible(false);
        setCurrentField(null);
      } else {
        updatedValue += key;
      }

      updateRoomData(index, field, updatedValue);
    }
  };

  const handleKeyboardClose = () => {
    setKeyboardVisible(false);
    setCurrentField(null);
  };
  


  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="flex w-full flex-col items-center justify-center border border-solid border-white-A700 py-[47px] md:py-5">
        <div className="container-xs flex flex-col items-start p-5">
          <div className="flex flex-col items-start gap-2">
            <Heading as="h1" className="text-xl md:text-2xl lg:text-3xl tracking-[9.00px] !text-black-900">
              {boardingHouse ? boardingHouse.bhname : "Loading..."}
            </Heading>
            <Heading size="xs" as="h2" className="text-sm md:text-lg lg:text-xl tracking-[7.00px] !text-cyan-800">
              Room Information
            </Heading>
          </div>
          <div className="mt-[86px] grid grid-cols-4 gap-[27px] w-[100%]">
            <Suspense fallback={<div>Loading feed...</div>}>
              {roomData.map((d, index) => (
                <BHInfoRoom
                  key={"bhinfo" + index}
                  roomnumber={d.roomnumber}
                  capacity={d.capacity}
                  onUpdate={(field, value) => updateRoomData(index, field, value)}
                  onClickField={(field) => handleInputClick(index, field)}
                />
              ))}
            </Suspense>
          </div>
          <Button
            color="blue_gray_100"
            shape="square"
            className="self-end mr-[31px] mt-12 px-5 py-2 text-sm sm:text-base md:min-w-[193px] md:text-lg lg:text-xl border-[5px] border-solid border-cyan-800 font-montserrat font-semibold md:mr-0"
            onClick={handleDoneClick}
          >
            DONE
          </Button>
        </div>
      </div>
      {keyboardVisible && (
        <div className="keyboard-container">
          <Keyboard onKeyPress={handleKeyPress} onClose={handleKeyboardClose} />
        </div>
      )}
      {showPopup && <DoneBHRegistration onClose={handleClosePopup} />}
    </>
  );
}
