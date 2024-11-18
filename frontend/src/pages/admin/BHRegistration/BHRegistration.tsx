import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Text, Heading } from "../../../components";
import { useNavigate, useLocation } from 'react-router-dom';
import Keyboard from '../../../components/Keyboard/Keyboard'; // Import the keyboard component

const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0;
    overscroll-y: scroll;
  }
  #root, .app {
    height: 700px;
  }
`;

export default function BHRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve owner
  const ownerId = location.state?.ownerId || 'defaultOwnerIdIfNoneProvided';

  const [formData, setFormData] = useState({
    bhname: '',
    bhaddress: '',
    bhrooms: '',
    owner: ownerId
  });

  const [errors, setErrors] = useState({
    bhname: '',
    bhaddress: '',
    bhrooms: ''
  });

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);

  const capitalizeEachWord = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const validateName = (name: string) => {
  // Updated regex to allow letters, numbers, spaces, periods, and commas
  const regex = /^[A-Za-z0-9\s.,]+$/;
  if (!regex.test(name)) {
    return 'Invalid Input!';
  }
  return '';
};

  const validateRooms = (rooms: string) => {
    const regex = /^[0-9]+$/;
    if (!regex.test(rooms)) {
      return 'Invalid Input!';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === 'bhname' || name === 'bhaddress') {
      updatedValue = capitalizeEachWord(value);
    } else if (name === 'bhrooms') {
      updatedValue = value.replace(/[^0-9]/g, ''); // remove non-digit characters
    }

    let error = '';
    if (name === 'bhname') {
      error = validateName(updatedValue);
    }
    if (name === 'bhrooms') {
      error = validateRooms(updatedValue);
    }

    setFormData({
      ...formData,
      [name]: updatedValue
    });

    setErrors({
      ...errors,
      [name]: error
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (errors.bhname || errors.bhrooms) {
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/boardinghouse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bhname: formData.bhname,
          bhaddress: formData.bhaddress,
          bhrooms: formData.bhrooms,
          owner: formData.owner
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const boardingHouseId = responseData.id;
        console.log('BH data saved successfully:', responseData);
        navigate('/bhinfo', { state: { bhrooms: formData.bhrooms, boardingHouseId } });
      } else {
        const errorData = await response.json();
        console.error('Failed to register boarding house:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInputClick = (fieldName: string) => {
  setCurrentField(fieldName);
  setKeyboardVisible(true);

  const inputField = document.querySelector(`input[name=${fieldName}]`) as HTMLInputElement;
  console.log(inputField);  // Check if the input field is found
  if (inputField) {
    inputField.focus();
    inputField.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};



 const handleKeyPress = (key: string) => {
  if (currentField) {
    setFormData(prev => {
      let newValue = prev[currentField];

      if (key === 'Backspace') {
        newValue = newValue.slice(0, -1);
      } else if (key === 'Enter') {
        const inputFields = ['bhname', 'bhaddress', 'bhrooms'];
        const currentIndex = inputFields.indexOf(currentField);

        if (currentIndex !== -1) {
          if (currentIndex < inputFields.length - 1) {
            // Move to the next input field
            const nextField = inputFields[currentIndex + 1];
            setCurrentField(nextField);
            const nextInput = document.querySelector(`input[name=${nextField}]`) as HTMLInputElement;

            if (nextInput) {
              nextInput.focus();
              nextInput.scrollIntoView({
                behavior: 'smooth',
                block: 'center',  // Scroll to the center of the viewport
              });
            }
          } else {
            // Submit the form if it's the last field
            handleSubmit(new Event('submit') as React.FormEvent<HTMLFormElement>);
          }
        }
      } else {
        newValue += key;
      }

      const event = { target: { name: currentField, value: newValue } };
      handleChange(event as React.ChangeEvent<HTMLInputElement>);

      return {
        ...prev,
        [currentField]: newValue
      };
    });
  }
};


  const closeKeyboard = () => {
    setKeyboardVisible(false);
  };

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
         <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full border border-cyan-800">
        <div className="flex min-h-screen items-center justify-center bg-[url('/public/images/bg.png')] bg-cover bg-no-repeat p-5">
          <div className="w-[647px] max-w-full rounded-lg bg-customgraybg-50 shadow-lg p-8">
            <Heading
              size="s"
              as="h1"
              className="text-white text-xl md:text-2xl text-center leading-tight md:leading-snug tracking-wide"
            >
              Register your Boarding House
            </Heading>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex flex-col">
                  <Text size="md" as="p" className="!font-open-sans tracking-wide text-white mb-1 pb-2 pt-2">
                    Name
                  </Text>
                  <input
                    name="bhname"
                    value={formData.bhname}
                    onChange={handleChange}
                    onClick={() => handleInputClick('bhname')}
                    className={`w-full border-b-2 ${errors.bhname ? 'border-red-500' : 'border-customColor1'} text-2xl bg-transparent text-white`}
                  />
                </div>
                <div className="flex flex-col">
                  <Text size="md" as="p" className="!font-open-sans tracking-wide text-white mb-1 pb-2 pt-2">
                    Address
                  </Text>
                  <input
                    name="bhaddress"
                    value={formData.bhaddress}
                    onChange={handleChange}
                    onClick={() => handleInputClick('bhaddress')}
                    className={`w-full border-b-2 ${errors.bhaddress ? 'border-red-500' : 'border-customColor1'} bg-transparent text-white text-2xl`}
                  />
                </div>
                <div className="flex flex-col">
                  <Text size="md" as="p" className="!font-open-sans tracking-wide text-white mb-1 pb-2 pt-2">
                    Number of Rooms
                  </Text>
                  <input
                    name="bhrooms"
                    value={formData.bhrooms}
                    onChange={handleChange}
                    onClick={() => handleInputClick('bhrooms')}
                    className={`w-full border-b-2 ${errors.bhrooms ? 'border-red-500' : 'border-customColor1'} bg-transparent text-white text-2xl`}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="p-2 bg-transparent border-none cursor-pointer">
                  <img src="/images/NxtBtn.png" alt="Next" className="h-15 w-15" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {keyboardVisible && (
        <div className="keyboard-container">
          <Keyboard onKeyPress={handleKeyPress} onClose={closeKeyboard} />
        </div>
      )}
    </>
  );
}
