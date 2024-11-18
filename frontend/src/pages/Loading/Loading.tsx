import { Helmet } from "react-helmet";
import { Text, Img } from "../../components";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Loading: React.FC = () => {
  const [bhName, setBhName] = useState<string>(""); // State to hold the boarding house name

  useEffect(() => {
    const fetchBoardingHouseName = async () => {
      try {
        const response = await axios.get(
          "https://hyptech-backend123-9fec1767e3d7.herokuapp.com/api/boardinghouse/"
        ); // Adjust this path if needed
        if (response.data && response.data.length > 0) {
          setBhName(response.data[0].bhname); // Assuming you want the first boarding house
        }
      } catch (error) {
        console.error("Error fetching boarding house name:", error);
      }
    };

    fetchBoardingHouseName();
  }, []);

      

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

          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

