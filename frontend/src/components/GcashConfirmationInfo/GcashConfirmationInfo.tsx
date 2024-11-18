import { Text, Button } from "../../components";
import axios from "axios";

interface GcashConfirmationInfoProps {
  boarder: string;
  reference_number: string;
  amount_paid: string;
  transaction_date: string;
  transaction_time: string;
  transactionId: number;
  onConfirm: () => void;
  onReject: () => void;
}

export default function GcashConfirmationInfo({
  boarder,
  reference_number,
  amount_paid,
  transaction_date,
  transaction_time,
  transactionId,
  onConfirm,
  onReject,
}: GcashConfirmationInfoProps) {
  const handleConfirmClick = async () => {
    try {
      if (!transactionId) {
        console.error("Transaction ID is undefined or invalid.");
        return;
      }

      await axios.post(
        `http://localhost:8000/api/gcashtransactions/${transactionId}/confirm/`
      );

      onConfirm();
    } catch (error) {
      console.error("Error confirming the transaction:", error);
    }
  };

  const handleRejectClick = async () => {
    try {
      if (!transactionId) {
        console.error("Transaction ID is undefined or invalid.");
        return;
      }

      await axios.post(
        `http://localhost:8000/api/gcashtransactions/${transactionId}/reject/`
      );
      onReject();
    } catch (error) {
      console.error("Error rejecting the transaction:", error);
    }
  };

  return (
    <div className="flex flex-1 items-start justify-between gap-5 rounded-[20px] bg-customgray p-[25px] sm:p-5 h-[200px]">
      <div className="flex flex-1 flex-col items-start">
        <Text as="p" className="tracking-[3.00px] !text-black-900">
          {boarder}
        </Text>
        <div className="ml-auto mb-0 mt-[-30px] self-end tracking-[3.00px] sm:self-auto">
          <Button
            className="mr-2 rounded-[20px] h-[30px] !font-montserrat bg-customcyan text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]"
            onClick={handleConfirmClick}
          >
            Confirm
          </Button>
          <Button
            className="ml-2 mt-[10px] rounded-[20px] h-[30px] px-[47px] !font-montserrat bg-customcyan text-white text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]"
            onClick={handleRejectClick}
          >
            Reject
          </Button>
        </div>
        <div className="flex-1 mt-[-80px]">
          <Text
            size="lg"
            as="p"
            className="relative tracking-[2.00px] !text-black-900"
          >
            <span className="!text-customdarkgray3">
              Gcash Reference Number:
            </span>{" "}
            {reference_number}
          </Text>

          <Text
            size="md"
            as="p"
            className="relative tracking-[2.00px] !text-customcyan"
          >
            ₱ {amount_paid}
          </Text>
          <Text
            size="s"
            as="p"
            className="relative tracking-[2.00px] !text-customdarkgray3"
          >
            {transaction_date}, {transaction_time}
          </Text>
        </div>
      </div>
    </div>
  );
}
