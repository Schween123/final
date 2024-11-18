import { Helmet } from "react-helmet";
import { Text, Heading, Img } from "../../../components";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from 'axios';
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

export default function BoarderRegistrationSuccessful() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = location.state || {};
  const [passcode, setPasscode] = useState<string | null>(null);
  const [bhName, setBhName] = useState<string>("");
  
useEffect(() => {
     const fetchBoardingHouseName = async () => {
          try {
              const response = await axios.get("http://localhost:8000/api/boardinghouse/");
              if (response.data && response.data.length > 0) {
                  setBhName(response.data[0].bhname);
                 }
               } catch (error) {
                   console.error("Error Fetching Boarding House name", error);
               }
             };
             
    fetchBoardingHouseName();
    
    if (tenantId) {
      // Fetch tenant data
      fetch(`http://127.0.0.1:8000/api/tenant/${tenantId}/`)
        .then((response) => response.json())
        .then((data) => {
          setPasscode(data.passcode);
          
          // Call the SMS sending API
          fetch(`http://127.0.0.1:8000/api/textapp/send_sms/${tenantId}/`, {  // Updated URL to 'textapp'
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer YOUR_ACCESS_TOKEN` // Include auth if needed
            }
          })
          .then(smsResponse => {
            if (smsResponse.ok) {
              console.log("SMS sent successfully!");
            } else {
              console.error("Failed to send SMS:", smsResponse.statusText);
            }
          })
          .catch((error) => console.error("Error sending SMS:", error));
        })
        .catch((error) => console.error("Error fetching tenant data:", error));
    }
  }, [tenantId]);

  if (!tenantId || passcode === null) {
    return <Loading />; // Handle the loading state or errors
  }

  const handleExitClick = () => {
    navigate("/splashscreen"); // Adjust this path if needed
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
      <div className="flex w-full flex-col justify-center border border-solid border-white-A700 py-[82px] md:py-5">
        <div className="container-xs my-[84px] flex justify-center px-[244px] md:p-5 md:px-5 mt-[-10px]">
          <div className="w-[70%] h-[60%] ">
            <div className="flex flex-col items-center rounded-[15px] border-[5px] border-solid border-gray-400 bg-blue_gray-100 p-[25px] shadow-xs sm:p-5 ">
              <button
                onClick={handleExitClick}
                className="h-[30px] w-[30px] self-end border-none bg-transparent"
              >
                <Img src="/images/Exit.png" alt="close" />
              </button>
              <Heading
                size="lg"
                as="h1"
                className="mt-[10px] tracking-[5.00px] !text-black-900"
              >
                You are all set up
              </Heading>
              <Text
                size="4xl"
                as="p"
                className="mt-[20px] w-[89%] text-center !font-montserrat leading-[60px] tracking-[5.00px] !text-black-900 md:w-full md:p-5"
              >
                Welcome to {bhName || "Loading. . ."} <br />
                Boarding House 
              </Text>
              <Text
                size="2xl"
                as="p"
                className="mb-[5px] mt-[27px] !font-montserrat tracking-[4.00px] !text-cyan-800"
              >
                Your passcode is <span className="font-bold">{passcode}</span>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
