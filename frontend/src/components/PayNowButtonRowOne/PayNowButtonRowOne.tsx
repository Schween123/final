import { Text } from '../../components';

interface Props {
    month: string;
    dueDate: string;
    price: string;
    onCheck: (checked: boolean) => void;
    isChecked: boolean;
}


const PayNowButtonRowOne: React.FC<Props> = ({ month, dueDate, price, onCheck, isChecked }) => {

  return (
    <div
     
      className={` flex justify-center items-center p-[9px] md:p-5 border-b-gray-400 border border-solid bg-customgray flex-1 shadow-lg`}
    >
      
      <div className="flex w-[96%] items-center justify-between gap-5 md:w-full sm:flex-col">
    {/* Left Section */}
    <div className="flex w-[22%] justify-center sm:w-full">
        <div className="flex w-full items-center gap-[25px]">
           {/* Checkbox */}
           <label className="flex items-center gap-2">
           <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onCheck(e.target.checked)}
                    className="custom-checkbox"
                />
            </label>

            {/* Text and Price Section */}
            <div className="flex flex-1 flex-col items-start">
                <Text as="p" className="tracking-[3.00px] !text-black-900 !font-open-sans">
                    {month} 
                </Text>
                <Text as="p" className="ml-auto mb-0 mt-[-20px] self-end tracking-[3.00px] !text-black-900 sm:self-auto !font-open-sans">
                    ₱ {price}  
                </Text>
                <Text size="s" as="p" className="relative mt-[-20px] tracking-[2.00px] !text-customgray2 !font-open-sans">
                    Due Date {dueDate}
                </Text>
            </div>
        </div>
    </div>
    </div>
</div>
                
  );
}

export default PayNowButtonRowOne;
