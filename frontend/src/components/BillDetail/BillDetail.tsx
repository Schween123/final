import { Text } from "../../components";

interface BillDetailProps {
    description: string;
    amount: string;
  }

  const BillDetail: React.FC<BillDetailProps> = ({ description, amount }) => {
    return (

<div className="flex justify-center bg-customgray p-6 shadow-md sm:p-5 border-b border-b-gray-400">
<div className="flex w-[95%] flex-wrap justify-between gap-5 md:w-full">
<Text as="p" className="self-end tracking-[3.00px] !text-black-900">
{description}
</Text>
<Text as="p" className="tracking-[3.00px] !text-black-900">
₱ {amount}
</Text>
</div>
</div>

);
};

export default BillDetail;
