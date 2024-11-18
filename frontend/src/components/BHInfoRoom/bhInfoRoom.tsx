import React, { useState, useEffect } from "react";
import { Text, Img, Input } from "../../components";

interface Props {
  className?: string;
  roomnumber?: string;
  capacity?: number;
  onUpdate: (field: keyof RoomData, value: string) => void;
  onClickField: (field: keyof RoomData) => void; // Add this prop
}

interface RoomData {
  roomnumber: string;
  capacity: number;
}

export default function BHInfoRoom({ roomnumber = "Room 1", capacity = 0, onUpdate, onClickField, ...props }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoomNumber, setEditedRoomNumber] = useState(roomnumber);

  useEffect(() => {
    setEditedRoomNumber(roomnumber); // Update editedRoomNumber when roomnumber prop changes
  }, [roomnumber]);

  const handleEditClick = () => {
    setIsEditing(true);
    onClickField('roomnumber'); // Open keyboard for room number
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "capacity") {
      const numericValue = Number(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        onUpdate(name as keyof RoomData, value); // Update capacity
      }
    } else if (name === "roomnumber") {
      setEditedRoomNumber(value);
      onUpdate(name as keyof RoomData, value); // Update room number
    }
  };

  const handleCapacityClick = () => {
    onClickField('capacity'); // Open keyboard for capacity
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (editedRoomNumber !== roomnumber) {
      onUpdate('roomnumber', editedRoomNumber); // Update only if there is a change
    }
  };

  return (
    <div
      {...props}
      className={`${props.className} flex flex-col items-start w-full gap-7 p-[25px] sm:p-5 bg-customdarkgray3 rounded-[15px] w-[279px]`}
    >
      <div className="mt-[13px] flex items-center gap-[18px]">
        {isEditing ? (
          <input
            type="text"
            name="roomnumber"
            value={editedRoomNumber}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="bg-white text-black rounded p-1"
            autoFocus
          />
        ) : (
          <Text size="2xl" as="p" className="!text-white font-open-sans">
            {editedRoomNumber}
          </Text>
        )}
        <Img
          src="public/images/editbtn.png"
          alt="edit"
          className="h-[25px] w-[25px] self-end cursor-pointer relative -top-2"
          onClick={handleEditClick}
        />
      </div>
      <div className="flex items-center">
        <Text size="md" as="p" className="!text-white font-open-sans">
          Capacity:
        </Text>
        <Input
          shape="square"
          name="capacity"
          value={capacity}
          onClick={handleCapacityClick}
          onChange={handleInputChange}
          placeholder="0"
          className="relative w-[90px] border-b-2 border-customdarkgray text-white !text-4xl ml-2"
        />
      </div>
    </div>
  );
}
