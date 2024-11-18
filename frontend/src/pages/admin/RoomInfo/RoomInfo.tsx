import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "../../../components/Header/Header";
import AdminRoomInfo from "../../../components/AdminRoomInfo/AdminRoomInfo";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import Loading from "../../Loading/Loading";

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
}

interface Tenant {
  assigned_room: number; // Room ID
}

export default function RoomInfoPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenantsPerRoom, setTenantsPerRoom] = useState<{
    [roomId: number]: number;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomData();
    fetchTenantData();
  }, []);

  const fetchRoomData = async () => {
    try {
      const response = await axios.get<Room[]>(
        "http://127.0.0.1:8000/api/rooms/"
      );
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching room data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantData = async () => {
    try {
      const response = await axios.get<Tenant[]>(
        "http://127.0.0.1:8000/api/tenant/"
      );
      const tenantData = response.data;

      // Count tenants per room
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

  if (loading) {
    return <Loading />;
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
      <div className="w-full">
        <Header />
        <div className="container-xs mb-[5px] px-[35px] md:p-5 sm:px-5 flex items-center justify-center min-h-screen">
          <div className="mt-[-150px] grid w-[95%] grid-cols-4 justify-center items-center gap-[27px] self-center md:grid-cols-4 sm:grid-cols-1">
            <Suspense fallback={<div>Loading feed...</div>}>
              {rooms.map((room) => (
                <Link to={`/boardersinfo/${room.id}`} key={room.id}>
                  {" "}
                  {/* Make it clickable */}
                  <AdminRoomInfo
                    room_number={room.room_number}
                    capacity={room.capacity}
                    registeredTenants={tenantsPerRoom[room.id] || 0} // Pass registered tenants
                    roomId={room.id} // Pass roomId
                  />
                </Link>
              ))}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
