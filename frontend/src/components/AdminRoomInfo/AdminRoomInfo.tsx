import { Text } from "../../components";
import { useNavigate } from "react-router-dom";

interface Props {
  className?: string;
  room_number?: string;
  capacity?: number;
  roomId: number;
  registeredTenants?: number; // Add this prop
}

export default function AdminRoomInfo({
  room_number = "Room 1",
  capacity = 0,
  registeredTenants = 0,
  roomId,
  ...props
}: Props) {
  const navigate = useNavigate();

  // Navigate to the BoarderInfoPage for the specific room
  const handleClick = () => {
    navigate(`/boardersinfo/${roomId}`);
  };
  return (
    <div
      {...props}
      onClick={handleClick} // Trigger navigation when the component is clicked
      className={`${props.className} cursor-pointer flex flex-col items-start w-full gap-7 p-[25px] sm:p-5 bg-customdarkgray3 rounded-[15px] w-[220px]`}
    >
      <div className="mt-[13px] flex items-center gap-[18px]">
        <Text size="xl" as="p" className="!text-white font-open-sans">
          {room_number}
        </Text>
      </div>
      <div className="flex items-center mt-[-15px]">
        <Text size="md" as="p" className="!text-white font-open-sans">
          Capacity: {registeredTenants}/{capacity}
        </Text>
      </div>
    </div>
  );
}
