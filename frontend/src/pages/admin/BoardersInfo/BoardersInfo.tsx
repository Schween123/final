import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Suspense, useEffect, useState, useCallback } from "react";
import BoarderInfoAdmin from "../../../components/BoarderInfoAdmin/BoarderInfoAdmin";
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

interface Tenant {
  id: number;
  boarderfirstname: string;
  boardermiddlename: string;
  boarderlastname: string;
  due_date: string;
  total_monthly_due: number;
}

interface Room {
  room_number: string;
}

export default function BoardersInfoPage() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>(); // Get roomId from URL
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchRoomNumber = useCallback(async () => {
    if (!roomId) return; // Handle undefined roomId
    try {
      const response = await axios.get<Room>(
        `http://127.0.0.1:8000/api/rooms/${roomId}/`
      );
      setRoomNumber(response.data.room_number);
    } catch (error) {
      console.error("Error fetching room number:", error);
    }
  }, [roomId]);

  const fetchTenantsForRoom = useCallback(async () => {
    if (!roomId) return; // Handle undefined roomId
    try {
      const response = await axios.get<Tenant[]>(
        `http://127.0.0.1:8000/api/tenant/room/${roomId}/`
      );
      setTenants(response.data);
    } catch (error) {
      console.error("Error fetching tenants for room:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomNumber();
    fetchTenantsForRoom();
  }, [fetchRoomNumber, fetchTenantsForRoom]);

  if (loading) {
    return <Loading />;
  }

  const handleButtonClick = () => {
    navigate(`/roominfo#`);
  };

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
      <div className="w-full border border-solid border-white-A700">
        <div className="flex flex-col items-center bg-customgray4">
          <div className="flex items-center self-stretch bg-customcyan p-3.5 h-[130px]">
            <button onClick={handleButtonClick} className="p-5 cursor-pointer">
              <img src="/images/backbtn.png" alt="Back" className="my-6 ml-5" />
            </button>
            <p className="text-[50px] tracking-[4.50px] text-white pl-5 !font-montserrat">
              {roomNumber}
            </p>{" "}
            {/* Display room number */}
          </div>
          <div className="container max-w-[1273px] mb-5 p-2">
            <div className="flex flex-col gap-4">
              <Suspense fallback={<div>Loading tenants...</div>}>
                {tenants.map((tenant, index) => (
                  <BoarderInfoAdmin
                    key={tenant.boarderfirstname + index}
                    boarder={`${tenant.boarderfirstname} ${tenant.boardermiddlename} ${tenant.boarderlastname}`}
                    duedate={tenant.due_date}
                    dues={<span>₱{tenant.total_monthly_due.toFixed(2)}</span>} // Pass as JSX
                    tenantId={tenant.id} // Pass tenant ID here for navigation
                  />
                ))}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
