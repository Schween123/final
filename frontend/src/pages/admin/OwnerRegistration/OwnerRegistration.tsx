import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Text, Heading, Img } from "../../../components";
import { useNavigate } from 'react-router-dom';
import Keyboard from '../../../components/Keyboard/Keyboard'; // Import the keyboard component

const globalStyles = `
  body, html {
    background-color: #C5C3C6;
    height: 100%;
    margin: 0;
    overflow-y: scroll;
  }
  #root, .app {
    height: 1111px;
  }
`;

export default function OwnerRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ownerfirstname: '',
    ownerlastname: '',
    owneraddress: '',
    ownercontact: '',
  });


  const [errors, setErrors] = useState({
    ownerfirstname: false,
    ownerlastname: false,
    ownercontact: false
  });


  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

// New camera and fingerprint states
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [fingerprintMessage, setFingerprintMessage] = useState<string | null>("Please place your finger on the sensor");
  const [isFingerprintReading, setIsFingerprintReading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);


    useEffect(() => {
      // Check if all fields are filled to show the camera
        console.log('Form Data:', formData);
        console.log('Show Camera:', showCamera);
      if (
        formData.ownerfirstname &&
        formData.ownerlastname &&
        formData.owneraddress &&
        formData.ownercontact.length === 11
      ) {
        setShowCamera(true);
      } else {
        setShowCamera(false);
      }
    }, [formData]);

  // Camera access and image capture function
  const handleCapture = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      const imageBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
      if (imageBlob) {
        const imageUrl = URL.createObjectURL(imageBlob);
        setCapturedImageUrl(imageUrl);

        // Stop the camera
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
        setShowCamera(false);

        // Upload the image to the backend
        const uploadData = new FormData();
        const imageName = `${formData.ownerfirstname}.jpg`; // Use firstName for the image file name
        uploadData.append('image', imageBlob, imageName);
        uploadData.append('ownerfirstname', formData.ownerfirstname);

        try {
          const response = await fetch('http://127.0.0.1:8000/api/adminfaceimages/', {
            method: 'POST',
            body: uploadData,
          });

          if (response.ok) {
            console.log('Image uploaded successfully');
            startFingerprintReading(); // Start fingerprint reading after capturing the image
          } else {
            console.error('Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
  };

  //Fingerprint
  const startFingerprintReading = async () => {
    setIsFingerprintReading(true);
    setFingerprintMessage("Please place your finger on the sensor...");

    try {
      const response = await fetch('http://localhost:8000/api/fingerprint_read/');
      const responseData = await response.json();

      if (response.ok) {
        setFingerprintMessage("Fingerprint registered successfully!");
        setFormData({ ...formData, fingerprint: responseData.fingerprint_data_base64 }); // Store fingerprint in formData
      } else {
        setFingerprintMessage("Failed to register fingerprint, please try again.");
      }
    } catch (error) {
      console.error('Error reading fingerprint:', error);
      setFingerprintMessage("Error reading fingerprint, please try again.");
    } finally {
      setIsFingerprintReading(false);
    }
  };



  // Auto capitalize first letter
 const capitalizeEachWord = (str: string) => {
  const romanNumerals = /^(II|III|IV|VI|VII|VIII|IX|X|IV|V|VI|VII|VIII|IX|X)$/i;
  const validSuffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  return str
    .split(' ')
    .map(word => {
      if (romanNumerals.test(word)) {
        return word.toUpperCase(); // Capitalize Roman numerals
      }
      // Capitalize suffixes if needed
      if (validSuffixes.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      // Capitalize first letter of other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

  const validateLastName = (name: string) => {
  const validSuffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const regex = /^[A-Za-z\s.]+$/; // Allow letters, spaces, and a period

  if (!regex.test(name)) {
    return 'Invalid Input! Only letters, periods, and spaces are allowed.';
  }
  // Check for multiple periods in the string
  if ((name.match(/\./g) || []).length > 1) {
    return 'Invalid Input! Only one period is allowed.';
  }
  // Ensure the last part is a valid suffix with a period, if a period is present
  const parts = name.split(' ');
  const lastPart = parts[parts.length - 1];

  if (lastPart.includes('.') && !validSuffixes.includes(lastPart)) {
    return 'Invalid suffix! Only Jr., Sr., or similar suffixes are allowed.';
  }

  return '';
};



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  let sanitizedValue = value;

  switch (name) {
    case 'ownerfirstname':
      // Remove non-letter characters, numbers, allow only letters and spaces
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');

      // Auto capitalize each word
      const firstName = capitalizeEachWord(sanitizedValue);

      const firstNameError = sanitizedValue !== value; // Check if there was any invalid character entered
      setErrors(prev => ({ ...prev, ownerfirstname: firstNameError }));
      setFormData(prev => ({
        ...prev,
        [name]: firstName
      }));
      break;

    case 'ownerlastname':
      sanitizedValue = value.replace(/[^A-Za-z\sIVXLCDM\.]/g, '');
      sanitizedValue = sanitizedValue.replace(/\.{2,}/g, '.'); // Prevent multiple periods

      const suffixes = ['Jr', 'Sr', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      const words = sanitizedValue.split(' ');
      const lastNameWithSuffix = words
        .map((word, index) => {
          if (suffixes.includes(word.toUpperCase())) {
            return word.toUpperCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');

      const lastNameError = lastNameWithSuffix !== value || /\.\s?\./.test(lastNameWithSuffix); // Detect multiple periods
      setErrors(prev => ({ ...prev, ownerlastname: lastNameError }));
      setFormData(prev => ({
        ...prev,
        [name]: lastNameWithSuffix
      }));
      break;

    case 'owneraddress':
      // Capitalize the first letter of each word in the address
      sanitizedValue = capitalizeEachWord(value);
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
      break;

    case 'ownercontact':
      // Ensure number is exactly 11 digits and starts with 09
      const contactValue = value.replace(/\D/g, ''); // Remove non-digit characters
      const contactError = contactValue.length !== 11 || !contactValue.startsWith('09');
      setErrors(prev => ({ ...prev, ownercontact: contactError }));
      setFormData(prev => ({ ...prev, ownercontact: contactValue }));
      break;

    default:
      setFormData(prev => ({ ...prev, [name]: value }));
      break;
  }
};




  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const imageName = `${formData.firstName}.jpg`;
    const imagePath = `/home/pi/Desktop/HyptechVF.2/Faces/Admin/${imageName}`;

    // Check if there are errors
    const formErrors = {
      ownerfirstname: !/^[A-Za-z\s]+$/.test(formData.ownerfirstname),
      ownerlastname: validateLastName(formData.ownerlastname) !== '',
      ownercontact: formData.ownercontact.length !== 11 || !formData.ownercontact.startsWith('09')
    };

    setErrors(formErrors);

    // Prevent submission if there are errors
    if (Object.values(formErrors).includes(true)) {
      alert('Please fix the errors before submitting.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/owner/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerfirstname: formData.ownerfirstname,
          ownerlastname: formData.ownerlastname,
          owneraddress: formData.owneraddress,
          ownercontact: formData.ownercontact,
          fingerprint: '',
          face_image: imagePath,  // Include the image path
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        navigate('/bhregistration', { state: { ownerId: responseData.id } });
      } else {
        console.error('Failed to register owner');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInputClick = (fieldName) => {
  setCurrentField(fieldName);
  setKeyboardVisible(true);
  handleInputFocus(fieldName); // Reuse the focus logic
};


   const handleInputFocus = (fieldName) => {
  setCurrentField(fieldName);
  setKeyboardVisible(true);

  setTimeout(() => {
    const inputElement = inputRefs.current[fieldName];
    if (inputElement) {
      inputElement.focus(); // Ensure the input is focused
      inputElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Scroll the input into the center of the view
      });
    }
  }, 0);
};



const handleKeyPress = (key: string) => {
  if (currentField) {
    setFormData((prev) => {
      let newValue = prev[currentField];

      if (key === 'Backspace') {
        newValue = newValue.slice(0, -1);
      } else if (key === 'Enter') {
        const fields = ['ownerfirstname', 'ownerlastname', 'owneraddress', 'ownercontact'];
        const currentIndex = fields.indexOf(currentField);
        const nextField = fields[currentIndex + 1];

        // If there's a next field, set focus to that field
        if (nextField) {
          setCurrentField(nextField);

          setTimeout(() => {
            inputRefs.current[nextField]?.focus(); // Focus the next field
            inputRefs.current[nextField]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center', // Scroll to the center
            });
          }, 0);  // Ensure state updates before focusing
        }
        // Do nothing if there's no next field
        return prev; // Exit early, prevent submitting or any other action
      } else {
        newValue += key;

        // Apply capitalization for specific fields
        if (currentField === 'ownerfirstname' || currentField === 'ownerlastname' || currentField === 'owneraddress') {
          newValue = capitalizeEachWord(newValue);
        }
      }

      handleChange({ target: { name: currentField, value: newValue } } as React.ChangeEvent<HTMLInputElement>);
      return { ...prev, [currentField]: newValue };
    });
  }
};




  const closeKeyboard = () => {
    setKeyboardVisible(false);
  };

useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
        }
      }
    };

    if (showCamera) {
      startCamera();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  return (
  <>
    <Helmet>
      <title></title>
      <meta name="description" content="Web site created using create-react-app" />
      <style>{globalStyles}</style>
    </Helmet>
    <div className="w-full border border-solid border-cyan-800">
      <div className="flex h-[1024px] items-center justify-center bg-[url(/images/bg.png)] bg-cover bg-no-repeat py-[82px] md:h-auto md:py-5">
        <div className="container-xs mb-20 mt-[52px] flex justify-center px-[281px] md:p-5 md:px-5">
          <div className="flex w-[363px] md:w-[90%] flex-col items-center gap-[50px] rounded-[15px] bg-customgraybg-50 shadow-lg p-[30px] md:w-full sm:p-8">
            <div className="relative flex flex-col items-center gap-[46px] rounded-[15px] bg-gray-800_7f p-7 sm:p-5">
              <Heading as="h1" className="text-shadow-ts mt-[10px] tracking-[9.00px] !text-white">
                Owner's profile
              </Heading>
              <form onSubmit={handleSubmit} className="flex md:flex-row flex-col items-start md:justify-between">
                <div className="relative mt-[33px] flex w-[300px] h-[300px] flex-col items-center gap-8 md:w-auto md:mr-36">
                  <div className="relative w-full h-full">
                    <Img
                      src={capturedImageUrl || "/images/face_holder.png"}
                      alt="faceholder"
                      className="object-cover w-full h-full"
                    />
                    {showCamera && !capturedImageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full bg-transparent border-4 border-red-500 rounded-lg flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleCapture}
                            className="absolute bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded"
                          >
                            Capture
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                      <Img 
                        src="/images/fingerprint_holder.png" 
                        alt="fingerprint" 
                        className="" 
                      />
                      {fingerprintMessage && (
                        <p className="text-white mt-4">{fingerprintMessage}</p>
                      )}
                    </div>
                </div>

                {/* Form inputs */}
                <div className="flex flex-col items-start self-stretch">
                  <Text size="md" as="p" className="!font-open-sans tracking-[2.50px] !text-white">
                    First Name
                  </Text>
                  <input
                    name="ownerfirstname"
                    value={formData.ownerfirstname}
                    onChange={handleChange}
                    onClick={() => handleInputClick('ownerfirstname')}
                    ref={(el) => inputRefs.current['ownerfirstname'] = el}
                    className={`!text-white w-[400px] border-b-2 border-customColor1 !text-xl pb-[-25px] pt-[25px] mt-[-17px] ${
                      errors.ownerfirstname ? 'border-red-500' : ''
                    }`}
                  />

                  <Text size="md" as="p" className="mt-[58px] !font-open-sans tracking-[2.50px] !text-white">
                    Last Name
                  </Text>
                  <input
                    name="ownerlastname"
                    value={formData.ownerlastname}
                    onChange={handleChange}
                    onClick={() => handleInputClick('ownerlastname')}
                    ref={(el) => inputRefs.current['ownerlastname'] = el}
                    className={`!text-white w-[400px] border-b-2 border-customColor1 !text-xl pb-[-25px] pt-[25px] mt-[-17px] ${
                      errors.ownerlastname ? 'border-red-500' : ''
                    }`}
                  />
                  
                  <Text size="md" as="p" className="mt-[58px] !font-open-sans tracking-[2.50px] !text-white">
                    Address
                  </Text>
                  <input
                    name="owneraddress"
                    value={formData.owneraddress}
                    onChange={handleChange}
                    onClick={() => handleInputClick('owneraddress')}
                    ref={(el) => inputRefs.current['owneraddress'] = el}
                    onFocus={() => handleInputFocus('owneraddress')}
                    className="!text-white w-[400px] border-b-2 border-customColor1 !text-xl pb-[-25px] pt-[25px] mt-[-17px]"
                  />
                  
                  <Text size="md" as="p" className="mt-[58px] !font-open-sans tracking-[2.50px] !text-white">
                    Contact Number
                  </Text>
                  <input
                    name="ownercontact"
                    value={formData.ownercontact}
                    onChange={handleChange}
                    onClick={() => handleInputClick('ownercontact')}
                    ref={(el) => inputRefs.current['ownercontact'] = el}
                    onFocus={() => handleInputFocus('ownercontact')}
                    className={`!text-white w-[400px] border-b-2 border-customColor1 !text-xl pb-[-25px] pt-[25px] mt-[-17px] ${
                      errors.ownercontact ? 'border-red-500' : ''
                    }`}
                    maxLength={11}
                    placeholder="09XXXXXXXXX"
                  />
                </div>

                {/* Submit button */}
                <div className="mt-[500px] ml-[-80px] relative flex justify-end w-[20%] md:mr-0">
                  <button type="submit" className="bg-transparent border-none cursor-pointer">
                    <img src="/images/NxtBtn.png" alt="arrowleft" />
                  </button>
                </div>
              </form>
            </div>
          </div>
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
