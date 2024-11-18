import { Helmet } from "react-helmet";
import { Button, Heading } from "../../components";
import RoomInfo from "./RoomInfo";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

interface Room {
  id: number;
  room_number: string;
  capacity: number;
  boarding_house: number;
}

interface Tenant {
  assigned_room: number; // Room ID
}

interface BoardingHouse {
  id: number;
  bhname: string;
  bhaddress: string;
}

export default function Guestpage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenantsPerRoom, setTenantsPerRoom] = useState<{
    [roomId: number]: number;
  }>({});
  const [loading, setLoading] = useState(true);
  const [boardingHouse, setBoardingHouse] = useState<BoardingHouse | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get<Room[]>(
          "http://127.0.0.1:8000/api/rooms/"
        );
        setRooms(response.data);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    const fetchTenantData = async () => {
      try {
        const response = await axios.get<Tenant[]>(
          "http://127.0.0.1:8000/api/tenant/"
        );
        const tenantData = response.data;
        const tenantCount: { [roomId: number]: number } = {};

        tenantData.forEach((tenant) => {
          if (tenant.assigned_room) {
            tenantCount[tenant.assigned_room] =
              (tenantCount[tenant.assigned_room] || 0) + 1;
          }
        });

        setTenantsPerRoom(tenantCount);
      } catch (error) {
        console.error("Error fetching tenant data:", error);
      }
    };

    const fetchBoardingHouseInfo = async () => {
      try {
        if (rooms.length > 0) {
          const boardingHouseId = rooms[0].boarding_house;
          const response = await axios.get<BoardingHouse>(
            `http://127.0.0.1:8000/api/boardinghouse/${boardingHouseId}/`
          );
          setBoardingHouse(response.data);
        }
      } catch (error) {
        console.error("Error fetching boarding house info:", error);
      }
    };

    const fetchData = async () => {
      try {
        await fetchRoomData();
        await fetchTenantData();
        await fetchBoardingHouseInfo();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rooms]); // Depend on rooms to trigger boarding house fetch when rooms are updated

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="flex w-full flex-col items-center justify-center border border-solid border-white-A700 py-[47px] md:py-5">
        <div className="container-xs flex flex-col items-start p-5">
          <div className="flex flex-col items-start gap-2">
            <Heading
              as="h1"
              className="text-xl md:text-2xl lg:text-3xl tracking-[9.00px] !text-black-900"
            >
              {boardingHouse ? boardingHouse.bhname : "Loading..."}
            </Heading>
            <Heading
              size="xs"
              as="h2"
              className="text-sm md:text-lg lg:text-xl tracking-[7.00px] !text-cyan-800"
            >
              {boardingHouse ? boardingHouse.bhaddress : "Loading..."}
            </Heading>
          </div>
          <div className="container-xs mb-[5px] px-[35px] md:p-5 sm:px-5 flex items-center justify-center min-h-screen">
            <div className="mt-[-50px] grid w-[90%] grid-cols-4 justify-center items-center gap-[27px] self-center md:grid-cols-4 sm:grid-cols-1">
              <Suspense fallback={<div>Loading feed...</div>}>
                {rooms.map((room) => (
                  <RoomInfo
                    key={room.id}
                    room_number={room.room_number}
                    capacity={room.capacity}
                    registeredTenants={tenantsPerRoom[room.id] || 0}
                    roomId={room.id}
                  />
                ))}
              </Suspense>
            </div>
            <div className="self-end mr-[31px] mt-[150px]">
            <Button
              color="blue_gray_100"
              shape="square"
              className="self-end mr-[31px] mt-[150px] px-5 py-2 text-sm sm:text-base md:min-w-[193px] md:text-lg lg:text-xl border-[5px] border-solid border-cyan-800 font-montserrat font-semibold md:mr-0"
              onClick={() => navigate("/splashscreen")}
            >
              Close
            </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
