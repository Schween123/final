import { Helmet } from "react-helmet";
import { Text, Heading } from "../../../components";
import BillDetail from "../../../components/BillDetail/BillDetail";
import { Suspense, useState, useEffect } from "react";
import TotalAmount from "../../../components/TotalAmount/TotalAmount";
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

interface BillType {
  description: string;
  amount: string;
}

interface TenantDetails {
  monthly_rent: number;
  total_monthly_due: number;
  due_date: string;
  add_ons: BillType[];
}

export default function BillDetailsPage() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [nextDueDate, setNextDueDate] = useState<string>('');

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/tenant/${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          setTenantDetails(data);
        
          const dueDate = new Date(data.due_date);

          // Calculate next due date based on the current date
          const currentDate = new Date();
          while (dueDate < currentDate) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }
          
          setNextDueDate(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(dueDate));
          
        } else {
          console.error("Failed to fetch tenant data");
        }
      } catch (error) {
        console.error("Error fetching tenant data:", error);
      }
    };

    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  const handleButtonClick = () => {
    navigate(`/boarderprofile/${tenantId}`);
  };
return (
    <>
        <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
        <style>{globalStyles}</style>
        </Helmet>
        <div className="min-h-screen w-full">
        <div className="pb-[347px] md:pb-5">
          <div className="mt-[-55px]">
            <div className="flex flex-col items-start justify-center gap-[63px] bg-customcyan py-[47px] md:py-5 sm:gap-[31px]">
              <div className="flex items-center gap-[34px] self-stretch bg-customcyan p-[47px] md:p-5 sn:flex-col h-[180px]">
              <button onClick={handleButtonClick} className="p-5 cursor-pointer">
                <img src="/images/backbtn.png" alt="arrowleft" />
              </button>
                <Text size="3xl" as="p" className="!font-open-sans mb-1 self-end tracking-[4.50px] !text-white sm:mb-0 sm:self-auto">
                  Bill Details
                </Text>
              </div>
              <div className="container-xs mb-4 px-[411px] md:p-5 md:px-5 mt-[-20px]">
              <div className="flex flex-col items-center gap-3">
                <Heading size="xl" as="h1" className="mr-[46px] tracking-[7.00px] md:mr-0 !text-white">
                    ₱ <TotalAmount total={tenantDetails?.total_monthly_due || 0} />
                </Heading>
                <Text size="xl" as="p" className="!font-montserrat tracking-[3.50px] !text-gray-300">
                    Due Date {nextDueDate} 
                </Text>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center bg-customgray p-6 shadow-md sm:p-5 border-b border-b-gray-400">
            <div className="flex w-[95%] flex-wrap justify-between gap-5 md:w-full">
                <Text as="p" className="self-end tracking-[3.00px] !text-black-900">
                Monthly Rent
                </Text>
                <Text as="p" className="tracking-[3.00px] !text-black-900">
                ₱ {tenantDetails?.monthly_rent.toFixed(2)}
                </Text>
            </div>
            </div>
            <Suspense fallback={<div>Loading add-ons...</div>}>
            {tenantDetails?.add_ons.map((bill, index) => (
              <BillDetail key={index} description={bill.description} amount={bill.amount} />
            ))}
          </Suspense>
                
        </div>
    </div>
    </>
    );
}

