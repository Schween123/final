import { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { Img, Text, Button, Heading } from "../../../components";
import { useNavigate, useParams } from 'react-router-dom';

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
}

interface Tenant {
  id: number;
  boarderfirstname: string;
  assigned_room: number;
  total_monthly_due: number;
  due_date: string;
  payment_status: Record<string, Record<string, string>>; // Update the type for payment_status
}

export default function BoarderProfilePage() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [totalAmount, settotalAmount] = useState<number>(0);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (tenantId) {
        try {
          const tenantResponse = await fetch(`http://127.0.0.1:8000/api/tenant/${tenantId}`);
          if (tenantResponse.ok) {
            const tenantData = await tenantResponse.json();
            setTenant(tenantData);
            console.log("Tenant Data:", tenantData);
            if (tenantData.assigned_room) {
              fetchRoomDetails(tenantData.assigned_room);
            }

            const dueDate = new Date(tenantData.due_date);

            // Calculate next due date based on the current date
            const currentDate = new Date();
            while (dueDate < currentDate) {
              dueDate.setMonth(dueDate.getMonth() + 1);
            }
            
            setNextDueDate(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(dueDate));
            
            calculateTotalDue(tenantData, dueDate);
            
          } else {
            console.error("Failed to fetch tenant details");
          }
        } catch (error) {
          console.error("Error fetching tenant details:", error);
        }
      }
    };

    const fetchRoomDetails = async (roomId: number) => {
      try {
        const roomResponse = await fetch(`http://127.0.0.1:8000/api/rooms/${roomId}`);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoom(roomData);
          console.log("Room Data:", roomData);
        } else {
          console.error("Failed to fetch room details");
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
      }
    };

    const calculateTotalDue = (tenantData: Tenant, dueDate: Date) => {
      const currentDate = new Date();
      const monthlyDue = tenantData.total_monthly_due;
      let totalAmount = 0; // Default to 0
    
      // Calculate the time difference between the next due date and the current date
      const diffTime = dueDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    
      // If the next due date is within 15 days, and the payment for that month is not marked as "paid", add the monthly due
      if (diffDays <= 15) {
        const year = dueDate.getFullYear();
        const month = dueDate.toLocaleString('default', { month: 'long' });
        const isMonthPaid = tenantData.payment_status[year]?.[month] === "paid";
    
        if (!isMonthPaid) {
          totalAmount += monthlyDue;
        }
      }
    
      // Handle accumulation of missed payments
      const missedMonths = Math.floor((currentDate.getTime() - new Date(tenantData.due_date).getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (missedMonths > 0) {
        for (let i = 1; i <= missedMonths; i++) {
          const pastMonthDate = new Date(tenantData.due_date);
          pastMonthDate.setMonth(pastMonthDate.getMonth() + i);
          const pastYear = pastMonthDate.getFullYear();
          const pastMonth = pastMonthDate.toLocaleString('default', { month: 'long' });
    
          if (tenantData.payment_status[pastYear]?.[pastMonth] !== "paid") {
            totalAmount += monthlyDue;
          }
        }
      }
    
      settotalAmount(totalAmount);
    };
    
    

    fetchTenantDetails();
  }, [tenantId]);

  if (!tenant || !room) {
    return <p>Loading...</p>;
  }

  

  const handleMyBillClick = () => {
    navigate(`/billdetails/${tenantId}`);
  };

  const handleTransactionsClick = () => {
    navigate(`/transactions/${tenantId}`);
  };

  const handlePayNowClick = () => {
    navigate(`/paynow/${tenantId}`);
  };

  const handleLogout = () => {
    navigate(`/splashscreen`);
  };

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full border border-solid border-white-A700 pb-[195px] md:pb-5">
        <div className="flex flex-col items-center">
          <div className="flex w-full h-[400px] items-start bg-[url(/images/BoarderProfilebg.svg)] bg-cover bg-no-repeat p-[50px] ">
            <div className="mb-[243px] ml-[15px] flex w-[63%] flex-col items-start gap-[54px] md:ml-0 md:w-full sm:gap-[27px]">
              <div className="flex flex-col items-start mt-[-20px]">
                <Heading as="h1" className="!font-semibold tracking-[4.50px] !text-white">
                  {tenant.boarderfirstname || "Loading..."} {/* Fallback text or loading state */}
                </Heading>
                <Text size="2xl" as="p" className="!font-montserrat tracking-[4.00px] !text-gray-300">
                  {room.room_number || "Loading..."} {/* Fallback text or loading state */}
                </Text>
              </div>
              <div className="!self-end sm:self-auto absolute mt-[-20px]">
                <Button onClick={handleLogout} className="mr-2 !font-montserrat text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]">
                  Log Out
                </Button>
              </div>

              
                <div className="flex w-[44%] flex-col items-center self-end md:w-full mt-[-20px]">
                  <div className="flex flex-wrap items-center justify-center gap-5 self-stretch">
                    <Heading size="lg" as="h2" className="!font-semibold tracking-[5.00px] !text-white">
                      ₱
                    </Heading>
                    <Heading size="xl" as="h3" className="!font-semibold tracking-[7.00px] !text-white">
                    {totalAmount.toFixed(2)}
                    </Heading>
                  </div>
                  <Text size="xl" as="p" className="!font-montserrat tracking-[3.50px] !text-gray-300">
                    Due
                  </Text>
                </div>
              
            </div>
          </div>
          <div className="container relative mt-[-150px] px-[187px] md:p-5 md:px-5 max-w-[900px] h-[396px] mx-auto md:h-[60%] md:w-[70%]">
            <div className="flex flex-col items-center gap-[53px] border-[5px] border-solid border-gray-400 bg-gray-300 p-[39px] shadow-lg sm:gap-[26px] sm:p-5">
              <div className="self-stretch pt-4">
                <div className="flex flex-col gap-[21px]">
                  <div className="flex items-start justify-between gap-5 md:flex-col">
                    <div className="flex w-[55%] flex-col gap-[38px] md:w-full">
                      <div className="flex w-full items-center justify-between mt-[-20px]">
                        <div className="flex items-center gap-1">
                          <Text as="p" className="!font-montserrat tracking-[3.00px] !text-customdarkgray2 !text-[25px]">
                            Next Bill
                          </Text>
                          <Text size="xl" as="p" className="!font-montserrat !font-medium tracking-[3.50px] !text-cyan-800 ml-2 !text-[28px]">
                            ₱  {tenant.total_monthly_due || "Loading..."}
                          </Text>
                        </div>
                        <Button onClick={handlePayNowClick}
                          size="sm"
                          shape="round"
                          className="min-w-[228px] font-montserrat font-semibold md:text-[30px] sm:px-5 sm:text-4x1 bg-customcyan !text-white float-right"
                        >
                          Pay Now
                        </Button>
                      </div>
                      <div className="flex w-full items-center justify-between mt-[-30px]">
                        <div className="flex items-center gap-1">
                          <Text as="p" className="!font-montserrat tracking-[3.00px] !text-customdarkgray2 !text-[25px]">
                            Due Date
                          </Text>
                          <Text as="p" className="!font-montserrat !font-medium tracking-[3.50px] ml-2 !text-customdarkgray2 !text-[28px]">
                          {nextDueDate} 
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[2px] bg-cyan-800" />
                  <div></div>
                  <div className="flex justify-center w-full">
                    <div className="flex justify-between items-center gap-[50px]">
                      <button onClick={handleMyBillClick} className="flex items-center gap-5 p-0 border-none bg-transparent cursor-pointer">
                        <Img src="/images/mybillbtn.png" alt="image" className="w-[30%]" />
                        <Text size="xl" as="p" className="mb-[22px] !font-montserrat !font-medium !text-customdarkgray2 !text-[30px]">
                          My Bill
                        </Text>
                        <Img src="/images/greaterthan_cyan.png" alt="arrowright" className="mb-[26px] w-[20px]" />
                      </button>
                      <button onClick={handleTransactionsClick} className="flex items-center gap-5 p-0 border-none bg-transparent cursor-pointer">
                        <Img src="/images/transactionsbtn.png" alt="image" className="w-[30%]"/>
                        <Text size="xl" as="p" className="mb-[22px] !font-montserrat !font-medium !text-customdarkgray2 !text-[30px]">
                          Transactions
                        </Text>
                        <Img src="/images/greaterthan_cyan.png" alt="arrowright" className="mb-[26px] w-[20px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
