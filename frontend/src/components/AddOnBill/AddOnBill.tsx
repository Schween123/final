import { Text, Input } from "./..";
import { useState } from "react"; // Import useState
import Keyboard from "../../components/Keyboard/Keyboard"; // Import the Keyboard component

interface Props {
  index: number;
  description: string;
  amount: string; // Keep amount as string
  onDescriptionChange: (index: number, description: string) => void;
  onAmountChange: (index: number, amount: string) => void; // Use string type for amount
  onFocusInput: (inputField: string) => void; // This will control showing the keyboard
  showKeyboard: boolean; // Props to control the keyboard visibility
  handleKeyPress: (key: string) => void; // Keypress handler for keyboard input
  closeKeyboard: () => void; // Close keyboard function
}

export default function AddOnBill({
  index,
  description,
  amount,
  onDescriptionChange,
  onAmountChange,
  onFocusInput,
  showKeyboard,
  handleKeyPress,
  closeKeyboard,
}: Props) {
  // Use local state to handle which input is focused (optional)
  const [focusedInput, setFocusedInput] = useState<string>("");

  return (
    <>
      <div className="flex justify-between w-full mt-[-20px]">
        <input
          name="MonthlyRent"
          placeholder="Description"
          value={description}
          onChange={(e) => onDescriptionChange(index, e.target.value)}
          onFocus={() => {
            onFocusInput(`addOnDescription-${index}`);
            setFocusedInput(`addOnDescription-${index}`); // Keep track of focused input
          }}
          className="relative w-[155px] ml-1 pb-[-30px] pt-[30px] !text-2xl"
        />
        <div className="mt-[-3px] flex items-center">
          <Text as="span" className="!font-opensans tracking-[3.00px] mb-[-35px]">
            ₱
          </Text>
          <Input
            shape="square"
            name="AddOn"
            placeholder="000.00"
            type="text"
            value={amount}
            onChange={(e) => onAmountChange(index, e.target.value)}
            onFocus={() => {
              onFocusInput(`addOnAmount-${index}`);
              setFocusedInput(`addOnAmount-${index}`); // Keep track of focused input
            }}
            className="relative w-[110px] border-b-2 border-customColor1 ml-1 pb-[-30px] pt-[30px] !text-2xl"
          />
        </div>

        {/* Conditionally render the keyboard */}
        {showKeyboard && focusedInput === `addOnAmount-${index}` && (
          <Keyboard onKeyPress={handleKeyPress} onClose={closeKeyboard} />
        )}
      </div>
    </>
  );
}
