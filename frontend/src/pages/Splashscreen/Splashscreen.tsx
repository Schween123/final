import { Helmet } from "react-helmet";
import { Text, Img } from "../../components";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SplashscreenPage: React.FC = () => {
  const navigate = useNavigate();
  const [distance, setDistance] = useState<number | null>(null);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false); // To track if face recognition is running
  const [bhName, setBhName] = useState<string>("");
  
   // Check if an owner exists
  useEffect(() => {
    const checkOwnerExistence = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/owner/');
        if (response.data && response.data.length === 0) {
          // No owner exists, redirect to OwnerRegistration
          navigate("/ownerregistration");
        }
      } catch (error) {
        console.error('Error checking owner existence:', error);
      }
    };

    checkOwnerExistence();
  }, [navigate]);

  
  const goToGuest = () => {
    navigate("/guestpage"); // Replace with actual boarder page route
  };

  // Function to start the live feed for face recognition
  const startLiveFeed = async () => {
    setIsRecognizing(true);  // Set flag to indicate face recognition is running
    try {
      const response = await fetch('http://localhost:8000/api/start-live-feed/', { method: 'GET' });
      if (response.ok) {
        console.log('Live feed started in the background.');

        // Get the detected face and status from the response
        const data = await response.json();
        if (data.name && data.status) {
          console.log('Detected face:', data.name, 'Status:', data.status);

          // Navigate based on the detected status
          if (data.status === 'owner') {
            navigate("/dashboard");
          } else if (data.status === 'tenant') {
            navigate("/login", { state: { tenantId: data.name } });
          } else if (data.status === 'guest') {
            navigate("/guestpage");
          }
        } else {
          // No face detected within 5 seconds
          console.log('No face detected. Returning to distance sensing.');
          setIsRecognizing(false);  // Reset flag to allow distance detection again
        }
      } else {
        console.error('Failed to start live feed');
      }
    } catch (error) {
      console.error('Error starting live feed:', error);
    } finally {
      setIsRecognizing(false);  // Reset the flag to allow distance detection again
    }
  };

  // Polling the sensor data every second
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
     
     
    const pollSensor = setInterval(async () => {
      if (!isRecognizing) {  // Only poll distance sensor if face recognition is not running
        try {
          const response = await axios.get('http://127.0.0.1:8000/api/sensor/');
          const { distance } = response.data;
          setDistance(distance);

          if (distance <= 92) { // If distance condition is met, start face recognition
            clearInterval(pollSensor);  // Stop polling when face recognition starts
            startLiveFeed();  // Trigger face recognition
          }
        } catch (error) {
          console.error('Error fetching sensor data:', error);
        }
      }
    }, 1000);  // Poll every second

    return () => clearInterval(pollSensor);  // Cleanup on unmount
  }, [isRecognizing]);  // Re-run effect if face recognition status changes
  
      
             
   

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
      </Helmet>
      <div className="flex h-screen w-full items-center justify-center bg-white-A700 bg-[url(/public/images/bg.png)] bg-cover bg-no-repeat">
        <div className="flex flex-col items-center justify-center h-full w-full p-5">
          <div className="relative flex flex-col items-center justify-center h-full w-full">
            <Img
              src="images/logo.png"
              alt="logoone"
              className="max-h-[50%] max-w-[50%] object-contain"
            />
            
            <Text
              size="2xl"
              as="p"
              className="mt-6 !text-with-shadow !font-bakbak-one tracking-[12.40px] !text-customgray text-center"
            >
              {bhName || "Loading. . ."}
            </Text>
            <div onClick={goToGuest} className="absolute self-end px-[20px] mt-[-380px]">
            <Img
              src="images/guests.png"
              alt="guest"
              className="shadow text-center w-[50px] h-auto"
            />
            <Text
              
              as="p"
              className="!text-with-shadow !font-opensans !text-customdarkgray text-center !text-[17px] h-[15px]"
            >
            GUEST
            </Text>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashscreenPage;

