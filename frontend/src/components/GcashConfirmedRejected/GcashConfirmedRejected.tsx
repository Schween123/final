import { Text } from "../../components";

interface GcashConfirmationInfoProps {
  boarder: string;
  reference_number: string;
  amount_paid: string;
  transaction_date: string;
  transaction_time: string;
  status: string;
}

export default function GcashConfirmedRejected({
  boarder,
  reference_number,
  amount_paid,
  transaction_date,
  transaction_time,
  status,
}: GcashConfirmationInfoProps) {
  return (
    <div className="flex flex-1 items-start justify-between gap-5 rounded-[20px] bg-customgray p-[25px] sm:p-5 h-[200px]">
      <div className="flex flex-1 flex-col items-start">
        <Text as="p" className="tracking-[3.00px] !text-black-900">
          {boarder}
        </Text>
        <div className="ml-auto mb-0 mt-[-30px] self-end tracking-[3.00px] sm:self-auto">
          <Text className="mr-2 h-[30px] !font-montserrat !text-customcyan text-[25px] sm:text-[20px] md:text-[23px] lg:text-[25px]">
            {status}
          </Text>
        </div>
        <div className="flex-1 ">
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
