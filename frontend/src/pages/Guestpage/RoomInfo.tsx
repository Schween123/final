import { Text } from "../../components";

interface Props {
  className?: string;
  room_number?: string;
  capacity?: number;
  roomId: number;
  registeredTenants?: number;
}

export default function RoomInfo({
  room_number = "Room 1",
  capacity = 0,
  registeredTenants = 0,
  className = "",
}: Props) {
  return (
    <div
      className={`${className} flex flex-col items-start w-full gap-7 p-[25px] sm:p-5 bg-customdarkgray3 rounded-[15px] w-[220px]`}
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
