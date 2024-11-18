import React, { FC, useEffect, useState } from "react";
import axios from "axios";
import { Button, Text } from "../../components";

interface CashPaymentModalProps {
  tenantId: string;
  amountPayable: number;
  selectedMonths: { month: string; year: string }[];
  onClose: () => void;
  onPaymentSuccess: (paidMonthKeys: number[]) => void;
}

const CashPaymentModal: FC<CashPaymentModalProps> = ({
  tenantId,
  amountPayable,
  selectedMonths,
  onClose,
  onPaymentSuccess,
}) => {
  const [billAmount, setBillAmount] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const startReading = () => {
    setIsReading(true);
  };

  const stopReading = () => {
    setIsReading(false);
  };
  
    // Function to turn off the inhibit pin
  const turnOffInhibitPin = async () => {
    try {
      await axios.post("http://localhost:8000/api/inhibit-control/", { action: "off" });
      console.log("Inhibit pin turned off.");
    } catch (error) {
      console.error("Error turning off inhibit pin:", error);
    }
  };
  
  // Function to turn on the inhibit pin
const turnOnInhibitPin = async () => {
  try {
    await axios.post("http://localhost:8000/api/inhibit-control/", { action: "on" });
    console.log("Inhibit pin turned on.");
  } catch (error) {
    console.error("Error turning on inhibit pin:", error);
  }
};
  

  useEffect(() => {
    turnOffInhibitPin();
    startReading();
    return () => stopReading();
  }, []);

  useEffect(() => {
    if (isReading) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:8000/api/bill-acceptor/');
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Received bill value:", data.bill_value); // Debug log
          
          if (data.bill_value && data.bill_value > 0) {
            // Update billAmount state
            setBillAmount(prevAmount => prevAmount + data.bill_value);

            // Compare the current bill amount with the payable amount
            const amountPayable = data.amount_payable; // Assuming the amount payable is part of the API response
            
            if (billAmount >= amountPayable) {
              // If the amount paid is greater than or equal to the amount payable, turn on the inhibit pin
              await stopReading();
            }
          }
        } catch (error) {
          console.error("Error fetching bill amount:", error);
        }
      }, 3000); // Interval to check every 5 seconds

      return () => clearInterval(interval); // Cleanup the interval when the component unmounts
    }
  }, [isReading, billAmount]); // Adding `billAmount` as a dependency so the effect re-runs when it's updated


  const handleConfirmPayment = async () => {
    turnOnInhibitPin();
    stopReading();
    console.log("Bill Amount:", billAmount.toFixed(2));
    console.log("Amount Payable:", amountPayable.toFixed(2));

    try {
      const transactionDate = new Date().toLocaleDateString("en-GB");
      const transactionTime = new Date().toLocaleTimeString("en-GB");

      // First, post the transaction
      await Promise.all(
        selectedMonths.map(async (monthInfo) => {
          const transactionData = {
            tenant: tenantId,
            transaction_date: transactionDate,
            transaction_time: transactionTime,
            amount_paid: billAmount / selectedMonths.length,
            payment_method: "Cash",
            month_paid_for: monthNamesToNumbers[monthInfo.month],
            year_paid_for: monthInfo.year,
          };

          await axios.post("http://localhost:8000/api/transactions/", transactionData);
          console.log("Data saved:", transactionData);
      
          
        })
        
      );
    
      onClose();

      // Notify the tenant and owners
      await axios.post("http://localhost:8000/api/confirm_payment/", {
        tenant: tenantId,
        amount_paid: billAmount,
        transaction_date: transactionDate,
        transaction_time: transactionTime,
        
      });
      console.log("Payment confirmed");


      onPaymentSuccess(
        selectedMonths.map((monthInfo) => monthNamesToNumbers[monthInfo.month])
      );
   
      onClose();
    } catch (error) {
      console.error("Error saving transaction or sending notifications:", error.response);
    }
  };

  const handleCancel = async () => {
    console.log("Stopping reading...");
    turnOnInhibitPin();
    stopReading();
    onClose();
  
    console.log("Closing...");
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

  // Disable the Confirm Payment button if billAmount is less than amountPayable
  const isConfirmDisabled = billAmount < amountPayable;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="relative w-full max-w-[650px] px-[20px] md:px-5">
        <div className="rounded-[10px] bg-white p-5 sm:p-4 w-full">
          <Button onClick={handleCancel} className=" absolute top-2 right-2">
            <img
              src="/images/Exit.png"
              alt="Exit"
              className="h-[20px] w-[20px]"
            />
          </Button>
          <Text className="!font-montserrat flex justify-center text-[25px] font-medium !text-customcyan sm:text-[30px] md:text-[35px] lg:text-[40px] pb-[20px]">
            PAY IN CASH
          </Text>
          <div className="flex flex-col sm:flex-col md:flex-row items-start justify-between gap-5 md:gap-10">
            {/* Left Side (Amount Payable and Selected Months) */}
            <div className="w-full md:w-[40%] mt-[-20px]">
              <Text
                as="p"
                className="!font-montserrat text-[25px] font-medium text-customdarkgray2 sm:text-[19px] md:text-[20px] lg:text-[25px] pt-[20px]"
              >
                Cash Inserted:
              </Text>
              <Text
                as="p"
                className="!font-montserrat !text-customcyan sm:text-[25px] md:text-[30px] lg:text-[35px] pt-[20px] pl-[20px]"
              >
                ₱ {billAmount.toFixed(2)}
              </Text>
            </div>
            {/* Divider */}
            <div className="h-auto w-[2px] ml-[-25px] bg-customcyan self-stretch" />

            {/* Right Side (Send to and Reference Input) */}
            <div className="flex-1 mt-[-20px]">
              <Text
                as="p"
                className="!font-montserrat text-[25px] font-medium text-customdarkgray2 sm:text-[19px] md:text-[20px] lg:text-[25px] pt-[20px]"
              >
                Selected Months:
              </Text>
              {selectedMonths.map((monthInfo, index) => (
                <Text key={index} size="md" as="p">
                  {monthInfo.month} {monthInfo.year}
                </Text>
              ))}
              <div className="mt-[30px]">
                <Button
                  onClick={handleConfirmPayment}
                  color="customcyan"
                  size="xs"
                  shape="round"
                  className="w-full rounded-[37px] px-[35px] py-[15px] !font-montserrat font-small bg-customcyan text-white text-[20px] sm:text-[20px] md:text-[23px] lg:text-[24px]"
                  disabled={isConfirmDisabled} // Disable button if billAmount < amountPayable
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentModal;

