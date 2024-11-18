import { Button, Input, Text, Img } from "../../../components";
import React, { useEffect, useState } from "react"; 
import axios from "axios";
import Keyboard from '../../../components/Keyboard/Keyboard'; // Import the Keyboard component

const globalStyles = `
  body, html {
    height: 100%;
    margin-bottom: 200px;
    overflow-y: scroll;
  }
  #root, .app {
    height: 100%;
    
    
    
  }
`;

interface GcashPaymentModalProps {
  tenantId: string;
  amountPayable: number;
  selectedMonths: { month: string; year: number }[]; 
  onClose: () => void;
  onPaymentSuccess: (monthsPaidFor: number[]) => void;
}

const GcashPaymentModalPage: React.FC<GcashPaymentModalProps> = ({
  tenantId,
  amountPayable,
  selectedMonths,
  onClose,
  onPaymentSuccess,
}) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [owner, setOwner] = useState<{ firstName: string; lastName: string; contact: string } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // State to control keyboard visibility

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/tenant/${tenantId}/`);
        const ownerData = response.data.owner;

        setOwner({
          firstName: ownerData.ownerfirstname,
          lastName: ownerData.ownerlastname,
          contact: ownerData.ownercontact,
        });
      } catch (error) {
        console.error("Error fetching owner data:", error);
      }
    };

    fetchOwnerData();
  }, [tenantId]);

  const handleConfirmPayment = async () => {
  try {
    const transactionDate = new Date().toLocaleDateString("en-GB");
    const transactionTime = new Date().toLocaleTimeString("en-GB");

    const monthsPaidFor = selectedMonths.map((monthInfo) => ({
      month_paid_for: monthNamesToNumbers[monthInfo.month],
      year_paid_for: monthInfo.year,
    }));

    const transactionData = {
      tenant: tenantId,
      transaction_date: transactionDate,
      transaction_time: transactionTime,
      amount_paid: amountPayable,
      payment_method: "GCash",
      months: monthsPaidFor,
      reference_number: referenceNumber,
      status: "pending",
    };


 // POST request to save the transaction
        await axios.post(
        "http://localhost:8000/api/gcashtransactions/",
        transactionData
      );
    
    console.log("Payment confirmed:",transactionData);

    const transactionResponse = await axios.post(
      "http://localhost:8000/api/gcash_confirm_payment/",
      transactionData
    );

    console.log("Transaction recorded:", transactionResponse.data);
    
    onPaymentSuccess(monthsPaidFor.map((month) => month.month_paid_for));
    onClose();
  } catch (error) {
    console.error("Error confirming payment:", error.response?.data || error.message);
  }
};


  const monthNamesToNumbers: { [key: string]: number } = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  // Function to handle keyboard input
  const handleKeyboardInput = (key: string) => {
  if (key === "Enter") {
    setKeyboardVisible(false);
  } else if (key === "Backspace") {
    setReferenceNumber((prev) => prev.slice(0, -1));
  } else if (/^[0-9]$/.test(key)) {
    setReferenceNumber((prev) => prev + key);
  }
};


  return (
    <>
       <style>{`
         .modal-content {
         margin-bottom: 100px;
         overflow-y: auto;
         }
         
         `}
        </style>
             
  
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="relative w-full max-w-[900px] px-[20px] md:px-5 modal-content ">
        <div className="rounded-[10px] bg-white p-5 sm:p-4 w-full">
          <Button onClick={onClose} className=" absolute top-2 right-2">
            <img src="/images/Exit.png" alt="Exit" className="h-[15px] w-[15px]" />
          </Button>
          <div className="flex flex-col sm:flex-col md:flex-row items-start justify-between gap-5 md:gap-10">
            <div className="w-full md:w-[40%]">
              <Img src="/images/GCash_logo_blue.png" alt="Gcashlogo" className="h-[30px] w-auto object-contain sm:w-full ml-[-50px]" />
              <Text as="p" className="!font-montserrat text-[25px] font-medium text-customdarkgray2 sm:text-[19px] md:text-[20px] lg:text-[25px] pt-[20px]">Amount Payable:</Text>
              <Text as="p" className="!font-montserrat text-[25px] font-medium !text-blue-900 sm:text-[19px] md:text-[20px] lg:text-[25px] pt-[20px]">₱ {amountPayable.toFixed(2)}</Text>
              <Text as="p" className="!font-montserrat text-[25px] font-medium text-customdarkgray2 sm:text-[19px] md:text-[20px] lg:text-[25px] pt-[20px]">Selected Months:</Text>
              {selectedMonths.map((monthInfo, index) => (
                <Text key={index} size="xs" as="p">
                  {monthInfo.month} {monthInfo.year}
                </Text>
              ))}
            </div>

            <div className="h-auto w-[2px] ml-[-120px] bg-blue-900 self-stretch" />

            <div className="flex-1">
              <Text as="p" className="!font-montserrat text-[25px] font-medium text-customdarkgray2 sm:text-[19px] md:text-[20px] lg:text-[25px]">Send to:</Text>
              {owner ? (
                <>
                  <Text as="p" className="ml-[45px] mt-3 !font-montserrat text-[28px] font-medium sm:text-[20px] md:text-[25px] lg:text-[28px] font-bold text-black-900">{owner.firstName} {owner.lastName}</Text>
                  <Text as="p" className="ml-[45px] mt-3 !font-montserrat text-[28px] font-medium sm:text-[20px] md:text-[25px] lg:text-[28px] font-bold text-black-900">{owner.contact}</Text>
                </>
              ) : (
                <Text as="p" className="ml-[45px] mt-3 text-red-600">Loading owner information...</Text>
              )}
              <div className="mt-8">
                <Text as="p" className="!font-montserrat font-medium text-[28px] font-medium sm:text-[20px] md:text-[25px] lg:text-[28px] !text-blue-900">Reference Number:</Text>
                <Input
                  variant="fill"
                  shape="round"
                  type="text"
                  name="reference_number"
                  value={referenceNumber} 
                  onChange={(e) => setReferenceNumber(e.target.value)} 
                  onFocus={() => setKeyboardVisible(true)} 
                  placeholder="Please Input Reference Number"
                  className=" w-full rounded-[20px] px-[21px] py-[10px] !font-montserrat bg-gray-300 text-[25px]"
                />
              </div>
              <div className="mt-12">
                <Button
                  color="blue_900"
                  size="xs"
                  shape="round"
                  onClick={handleConfirmPayment}
                  className=" w-full rounded-[37px] px-[35px] py-[15px] !font-montserrat font-medium bg-blue-900 text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px] "
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {keyboardVisible && (
        <Keyboard
          onKeyPress={handleKeyboardInput}
          onClose={() => setKeyboardVisible(false)}
        />
      )}
    </div>
    </>
  );
};

export default GcashPaymentModalPage;
