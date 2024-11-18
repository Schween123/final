import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Text, Input } from "../../../components";
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
    height: 600px;
  }
`;

const capitalizeEachWord = (str: string) => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const validateName = (name: string) => {
  const regex = /^[A-Za-z\s]+$/;   // only letters and spaces allowed
  if (!regex.test(name)) {
    return 'Invalid Input! Only letters and spaces are allowed.';
  }
  return '';
};

const validateMiddleName = (name: string) => {
  const regex = /^[A-Za-z]\.$/;           //  single letter followed by a dot
  const noDigits = /^[A-Za-z\s.]+$/;     // only letters, spaces, and dots allowed
  if (!noDigits.test(name)) {
    return 'Invalid Input! No numbers allowed.';
  }
  if (!regex.test(name)) {
    return 'Invalid Format! Use "M." or "L."';
  }
  return '';
};

const validateLastName = (name: string) => {
  // Allow letters, periods, and spaces
  const regex = /^[A-Za-z\s.]+$/;
  if (!regex.test(name)) {
    return 'Invalid Input! Only letters, periods, and spaces are allowed.';
  }

  // disable multiple periods
  if ((name.match(/\./g) || []).length > 1) {
    return 'Invalid Input! Only one period is allowed.';
  }

  // Jr. and Sr. as valid suffixes
  const validSuffixes = ['Jr.', 'Sr.'];
  const parts = name.split(' ');
  const lastPart = parts[parts.length - 1];

  if (validSuffixes.includes(lastPart)) {
    return '';
  }

  return '';
};

const formatLastName = (name: string) => {
  const suffixes = ['III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const parts = name.split(' ');

  const formattedParts = parts.map(part => {
    // Check if part is a suffix and capitalize it if so
    if (suffixes.includes(part.toUpperCase())) {
      return part.toUpperCase();
    }
    return capitalizeEachWord(part);
  });

  return formattedParts.join(' ');
};

const validateContactNumber = (number: string) => {
  const regex = /^09\d{9}$/;        // must start with 09 followed by exactly 9 digits
  if (!regex.test(number)) {
    return 'Invalid Contact Number! Must be 11 digits long and start with "09".';
  }
  return '';
};

const validateRelationship = (relationship: string) => {
  const regex = /^[A-Za-z\s]+$/;    // only letters and spaces allowed
  if (!regex.test(relationship)) {
    return 'Invalid Input! Only letters and spaces are allowed.';
  }
  return '';
};

export default function GuardianRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = location.state || {};

  const [formData, setFormData] = useState({
    guardianfirstname: '',
    guardianmiddlename: '',
    guardianlastname: '',
    guardianaddress: '',
    guardiancontactnumber: '',
    relationship: '',
    tenant: tenantId
  });

  const [errors, setErrors] = useState({
    guardianfirstname: '',
    guardianmiddlename: '',
    guardianlastname: '',
    guardiancontactnumber: '',
    guardianaddress: '',
    relationship: ''
  });

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const inputRefs = useRef<any>({});                                           //ref



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Capitalization logic
    if (name === 'guardianfirstname' || name === 'guardianlastname') {
      updatedValue = formatLastName(value);   // apply formatLastName to the last name
    }

    // Convert middle name to uppercase
    if (name === 'guardianmiddlename') {
      updatedValue = value.toUpperCase();
    }

    // Capitalize each word in the address field
    if (name === 'guardianaddress') {
      updatedValue = capitalizeEachWord(value);
    }

    // Handle contact number
    if (name === 'guardiancontactnumber') {
      updatedValue = updatedValue.replace(/[^0-9]/g, ''); // Remove non-digits
      if (updatedValue.startsWith('9')) {
        updatedValue = '0' + updatedValue; // Add leading 0 if starts with 9
      }
      if (updatedValue.length > 11) {
        updatedValue = updatedValue.slice(0, 11); // Limit to 11 digits
      }
      setErrors({
        ...errors,
        guardiancontactnumber: validateContactNumber(updatedValue)
      });
    }

    // Handle relationship field
    if (name === 'relationship') {
      updatedValue = capitalizeEachWord(value);
      updatedValue = updatedValue.replace(/[^A-Za-z\s]/g, ''); // Remove non-letters and spaces
      setErrors({
        ...errors,
        relationship: validateRelationship(updatedValue)
      });
    }

    // remove invalid characters and ensure only one period in last name
    if (name === 'guardianfirstname') {
      updatedValue = updatedValue.replace(/[^A-Za-z\s]/g, '');
      setErrors({
        ...errors,
        guardianfirstname: validateName(updatedValue)
      });
    } else if (name === 'guardianmiddlename') {
      updatedValue = updatedValue.replace(/[^A-Za-z\s.]/g, '');
      setErrors({
        ...errors,
        guardianmiddlename: validateMiddleName(updatedValue)
      });
    } else if (name === 'guardianlastname') {
      // Remove multiple periods
      updatedValue = updatedValue.replace(/[^A-Za-z\s.]/g, '');
      updatedValue = updatedValue.replace(/\.{2,}/g, '.');
      const lastNameError = validateLastName(updatedValue);
      setErrors({
        ...errors,
        guardianlastname: lastNameError
      });
    } else if (name === 'guardianaddress') {
      setErrors({
        ...errors,
        guardianaddress: ''
      });
    }

    setFormData({
      ...formData,
      [name]: updatedValue
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check for errors
    const newErrors = {
        guardianfirstname: validateName(formData.guardianfirstname),
        guardianmiddlename: validateMiddleName(formData.guardianmiddlename),
        guardianlastname: validateLastName(formData.guardianlastname),
        guardiancontactnumber: validateContactNumber(formData.guardiancontactnumber),
        guardianaddress: formData.guardianaddress ? '' : 'Address is required!',
        relationship: validateRelationship(formData.relationship)
    };

    setErrors(newErrors);

    // If there are any errors, stop submission and highlight the fields
    if (Object.values(newErrors).some(error => error)) {
        return; // Prevent submission if there are errors
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/guardian/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Guardian data saved successfully:', responseData);
            navigate('/billregistration', { state: { tenantId } }); // Navigate to the next page on success
        } else {
            const errorData = await response.json();
            console.error('Failed to save guardian data:', errorData);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};


  const handleInputClick = (fieldName: string) => {
    setCurrentField(fieldName);
    setKeyboardVisible(true);

    // Scroll the input into view
    if (inputRefs.current[fieldName]) {
      inputRefs.current[fieldName].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };



   const handleInputFocus = (field: string) => {
    setCurrentField(field);
    setShowKeyboard(true);
    setTimeout(() => {
      inputRefs.current[field]?.focus();
    }, 0);
  };

 const handleKeyPress = (key: string) => {
  if (currentField) {
    setFormData(prev => {
      let newValue = prev[currentField];

      if (key === 'Backspace') {
        newValue = newValue.slice(0, -1);
      } else if (key === 'Enter') {
        // Move to the next input field or submit the form
        const inputFields = [
          'guardianfirstname',
          'guardianmiddlename',
          'guardianlastname',
          'guardianaddress',
          'guardiancontactnumber',
          'relationship'
        ];
        const currentIndex = inputFields.indexOf(currentField);

        if (currentIndex < inputFields.length - 1) {
          const nextField = inputFields[currentIndex + 1];
          setCurrentField(nextField);

          // Focus and scroll to the next field
          setTimeout(() => {
            const nextInput = inputRefs.current[nextField];
            nextInput?.focus();
            nextInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 0); // delay
        } else {
          handleSubmit(new Event('submit') as React.FormEvent<HTMLFormElement>);
        }
        return prev; // Prevent adding 'Enter' as text
      } else {
        newValue += key;
      }

      handleChange({
        target: { name: currentField, value: newValue }
      } as React.ChangeEvent<HTMLInputElement>);

      return { ...prev, [currentField]: newValue };
    });
  }
};




  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
        <style>{globalStyles}</style>
      </Helmet>
      <form onSubmit={handleSubmit}>
        <div className="flex w-full flex-col items-center border border-solid border-white-A700 py-14 md:py-5">
          <div className="container-xs mb-[5px] flex flex-col gap-[139px] md:gap-[104px] md:p-5 sm:gap-[69px]">
            <div className="flex flex-col items-start justify-center gap-[21px]">
              <Text size="2xl" as="p" className="!font-montserrat tracking-[8.00px] !text-black-900">
                Kindly fill your Guardian's details
              </Text>
              <div className="h-px self-stretch bg-cyan-800" />
            </div>
            <div className="flex w-full justify-between gap-[120px] mt-[-80px]">
              <div className="flex w-[48%] flex-col items-start">
                <div className="ml-[33px] flex w-full flex-col items-start md:ml-0">
                  <Text size="md" as="p" className="relative z-[1] !font-opensans tracking-[2.50px]">
                    Name
                  </Text>
                  <div className="relative mt-[-2px] flex gap-[17px] self-stretch">
                    <Input
                      shape="square"
                      name="guardianfirstname"
                      value={formData.guardianfirstname}
                      onChange={handleChange}
                      onClick={() => handleInputClick('guardianfirstname')}
                      ref={(el) => inputRefs.current['guardianfirstname'] = el}
                      className={`w-[220px] border-b-2 ${errors.guardianfirstname ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                    />
                    <Input
                      shape="square"
                      name="guardianmiddlename"
                      value={formData.guardianmiddlename}
                      onChange={handleChange}
                      onClick={() => handleInputClick('guardianmiddlename')}
                      ref={(el) => inputRefs.current['guardianmiddlename'] = el}
                      className={`w-[66px] border-b-2 ${errors.guardianmiddlename ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                    />
                    <Input
                      shape="square"
                      name="guardianlastname"
                      value={formData.guardianlastname}
                      onChange={handleChange}
                      onClick={() => handleInputClick('guardianlastname')}
                      ref={(el) => inputRefs.current['guardianlastname'] = el}
                      className={`w-[220px] border-b-2 ${errors.guardianlastname ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                    />
                  </div>
                  <Text size="md" as="p" className="mt-[20px] !font-opensans tracking-[2.50px]">
                    Address
                  </Text>
                  <Input
                    shape="square"
                    name="guardianaddress"
                    value={formData.guardianaddress}
                    onChange={handleChange}
                    onClick={() => handleInputClick('guardianaddress')}
                    ref={(el) => inputRefs.current['guardianaddress'] = el}
                    className={`w-[460px] border-b-2 ${errors.guardianaddress ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                  />
                </div>
              </div>
              <div className="ml-[-50px] flex flex-col items-start mt-[-3px]">
                <Text size="md" as="p" className="!font-opensans tracking-[2.50px]">
                  Contact Number
                </Text>
                <Input
                  shape="square"
                  name="guardiancontactnumber"
                  value={formData.guardiancontactnumber}
                  onChange={handleChange}
                  onClick={() => handleInputClick('guardiancontactnumber')}
                  ref={(el) => inputRefs.current['guardiancontactnumber'] = el}
                  className={`w-[400px] border-b-2 ${errors.guardiancontactnumber ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                  placeholder="09XXXXXXXXX"
                />
                <Text size="md" as="p" className="mt-[20px] !font-opensans tracking-[2.50px]">
                  Relationship
                </Text>
                <Input
                  shape="square"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  onClick={() => handleInputClick('relationship')}
                  ref={(el) => inputRefs.current['relationship'] = el}
                  className={`w-[400px] border-b-2 ${errors.relationship ? 'border-red-500' : 'border-customColor1'} pb-[-30px] pt-[30px] !text-xl mt-[-10px]`}
                />
                <div className="self-end mt-[30px]">
                  <button type="submit" className="bg-transparent border-none cursor-pointer">
                    <img src="/images/nxtbtn2.png" alt="arrowleft" className="w-[65%]"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      {keyboardVisible && <Keyboard onKeyPress={handleKeyPress}
      onClose={() => setKeyboardVisible(false)}
       />}
    </>
  );
}
