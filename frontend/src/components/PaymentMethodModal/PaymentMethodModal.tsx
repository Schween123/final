import React from "react";
import { Button, Text } from "../../components";

interface PaymentMethodModalProps {
  onClose: () => void;
  onPaymentMethodSelect: (method: string) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  onClose,
  onPaymentMethodSelect,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="bg-white p-5 rounded shadow-lg">
        <Text size="lg" as="p" className="font-open-sans mb-4 items-center">
          Select Payment Method
        </Text>
        <div className="flex justify-between">
          <Button
            onClick={() => onPaymentMethodSelect("GCASH")}
            className="mr-2 w-full rounded-[37px] px-[35px] py-[15px] !font-montserrat font-medium bg-customcyan text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]"
          >
            GCash
          </Button>
           </div>
        <div className="mt-4">
          <Button
            onClick={() => onPaymentMethodSelect("CASH")}
            className=" w-full rounded-[37px] px-[35px] py-[15px] !font-montserrat font-medium bg-customcyan text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]"
          >
            Cash
          </Button>
        </div>
        <Button
          onClick={onClose}
          className="mt-4 w-full rounded-[37px] px-[35px] py-[15px] !font-montserrat font-medium bg-white text-customcyan text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
