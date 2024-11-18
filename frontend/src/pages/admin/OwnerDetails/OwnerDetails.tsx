import { Text, Heading } from "../../../components";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Keyboard from "../../../components/Keyboard/Keyboard"; // Import keyboard component

const globalStyles = `
  body, html {
    background-color: #C5C3C6;
    height: 100%;
    margin: 0;
    overflow-y: scroll;
  }
  #root, .app {
    height: 700px;
  }
`;

interface Owner {
  id: number;
  ownerfirstname: string;
  ownerlastname: string;
  owneraddress: string;
  ownercontact: string;
}

const OwnerDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { ownerId } = useParams<{ ownerId: string }>(); // Get ownerId from the URL
  const [owner, setOwner] = useState<Owner | null>(null); // State to store owner data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const [error, setError] = useState<string | null>(null); // State to manage errors
  const [isEditMode, setIsEditMode] = useState(false); // To track edit mode
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeField, setActiveField] = useState<"ownerfirstname" | "ownerlastname" | "owneraddress" | "ownercontact" | null>(null); // Active field
  const activeFieldRef = useRef<HTMLInputElement | null>(null);

  // Fetch owner data
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!ownerId) return; // Ensure ownerId is available

      try {
        const response = await axios.get<Owner>(
          `http://127.0.0.1:8000/api/owner/${ownerId}/`
        ); // Fetch the owner data by ownerId
        setOwner(response.data); // Set the owner data
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching owner data:", err); // Log any errors
        setError("Failed to fetch owner data");
        setIsLoading(false);
      }
    };

    fetchOwnerDetails();
  }, [ownerId]); // Fetch owner data when the component mounts or ownerId changes

  if (isLoading) {
    return <p>Loading...</p>; // Show loading state
  }

  if (error) {
    return <p>Error: {error}</p>; // Show error message if there's an issue
  }

  const handleEditClick = () => {
    setIsEditMode(true); // Enable edit mode
  };

  const handleSaveClick = async () => {
    if (!owner) return; // Ensure owner data is available before saving
    // Validate inputs before saving
    if (!validateInputs(owner)) {
      alert("Please correct the input errors before saving.");
      return;
    }
    try {
      await axios.put<Owner>(
        `http://127.0.0.1:8000/api/owner/${ownerId}/`,
        owner
      ); // Update owner data
      setIsEditMode(false); // Disable edit mode after saving
    } catch (err) {
      console.error("Failed to update owner details", err);
    }
  };


// Input validation
const validateInputs = (owner: Owner) => {
  const { ownerfirstname, ownerlastname, ownercontact, owneraddress } = owner;

  // Updated regex to allow spaces
  const nameRegex = /^[a-zA-Z\s]*(Jr\.|Sr\.|III|IV|V)?$/; // Allow letters, spaces, and suffixes
  const contactRegex = /^(09\d{9})$/; // Allow only numbers starting with '09' and having 11 digits
  const addressRegex = /^[a-zA-Z0-9\s.,'-]*$/; // Allow letters, numbers, spaces, and common special characters

  if (!nameRegex.test(ownerfirstname) || !nameRegex.test(ownerlastname)) {
    return false; // Invalid first or last name
  }

  if (!contactRegex.test(ownercontact)) {
    return false; // Invalid contact number
  }

  if (!addressRegex.test(owneraddress)) {
    return false; // Invalid address
  }

  return true; // All validations passed
};



  // Show keyboard when an input field is focused
  const handleFieldFocus = (field: "ownerfirstname" | "ownerlastname" | "owneraddress" | "ownercontact") => {
    setActiveField(field);
    setKeyboardVisible(true);

    // Scroll into view to avoid keyboard overlap
    setTimeout(() => {
      activeFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Handle keyboard input
  // Helper function to convert string to title case
const toTitleCase = (str: string) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const handleKeyboardInput = (key: string) => {
  if (!activeField || !owner) return; // Ensure activeField and owner data are available

  // If "Enter" key is pressed, handle it differently
  if (key === "Enter") {
    if (activeField === "ownercontact") {
      handleSaveClick(); // Call save function if it's the last field
    } else {
      // Move to the next field (you'll need to define the field order here)
      const nextField =
        activeField === "ownerfirstname"
          ? "ownerlastname"
          : activeField === "ownerlastname"
          ? "owneraddress"
          : "ownercontact";

      setActiveField(nextField);
      activeFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // Handle other key inputs
  setOwner((prevOwner) => {
    if (!prevOwner) return prevOwner;

    const currentValue = prevOwner[activeField] || ""; // Get current value of the active field
    let updatedValue = currentValue;

    if (key === "Backspace") {
      // Remove the last character if Backspace is pressed
      updatedValue = currentValue.slice(0, -1);
    } else {
      // Add the key character to the end of the current value
      updatedValue = currentValue + key;
    }

    // Apply title case for ownerfirstname, ownerlastname, and owneraddress
    if (activeField === "ownerfirstname" || activeField === "ownerlastname" || activeField === "owneraddress") {
      updatedValue = toTitleCase(updatedValue); // Convert to title case
    }

    // Update the field value
    return {
      ...prevOwner,
      [activeField]: updatedValue,
    };
  });
};



  const handleCloseKeyboard = () => {
    setKeyboardVisible(false); // Close the keyboard
    setActiveField(null); // Reset the active field
  };

  const handleButtonClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <>
      <Helmet>
        <title>Owner Details</title>
        <meta name="description" content="Owner details page" />
        <style>{globalStyles}</style>
      </Helmet>

      <div>
        <div className="flex flex-col items-center justify-center gap-[49px] bg-gray-300 pb-[143px] md:pb-5">
          <div className="self-stretch">
            <div className="flex flex-col items-center gap-[15px] bg-customcyan py-8 sm:py-5">
              <header className="mt-[21px] flex w-[94%] items-start justify-between gap-5 md:w-full md:px-5">
                <button
                  onClick={handleButtonClick}
                  className="p-5 cursor-pointer"
                >
                  <img src="/images/backbtn.png" alt="Back" />
                </button>
                <div className="mb-[9px] flex w-[50%] justify-end ">
                  {!isEditMode ? (
                    <button
                      className="p-5 cursor-pointer"
                      onClick={handleEditClick}
                    >
                      <img
                        src="/images/edit(white).png"
                        alt="Edit"
                        className="h-[40px] w-[40px]"
                      />
                    </button>
                  ) : (
                    <button
                      className="p-5 cursor-pointer"
                      onClick={handleSaveClick}
                    >
                      <img
                        src="/images/check.png"
                        alt="Save"
                        className="h-[40px] w-[40px]"
                      />
                    </button>
                  )}
                </div>
              </header>
              <div className="container-xs flex flex-col items-center gap-2 px-[301px] md:px-5">
                <Heading
                  size="xl"
                  as="h1"
                  className="!font-semibold tracking-[4.50px] !text-white pb-[50px]"
                >
                  {isEditMode ? (
                    <div>
                      <input
                        ref={activeField === "ownerfirstname" ? activeFieldRef : null}
                        type="text"
                        className="w-[200px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customgray mr-3"
                        value={owner?.ownerfirstname || ""}
                        onFocus={() => handleFieldFocus("ownerfirstname")}
                        onChange={(e) =>
                          setOwner((prevOwner) => {
                            if (!prevOwner) return null;
                            return {
                              ...prevOwner,
                              ownerfirstname: e.target.value, // Update first name
                            };
                          })
                        }
                      />
                      <input
                        ref={activeField === "ownerlastname" ? activeFieldRef : null}
                        type="text"
                        className="w-[200px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customgray"
                        value={owner?.ownerlastname || ""}
                        onFocus={() => handleFieldFocus("ownerlastname")}
                        onChange={(e) =>
                          setOwner((prevOwner) => {
                            if (!prevOwner) return null;
                            return {
                              ...prevOwner,
                              ownerlastname: e.target.value, // Update last name
                            };
                          })
                        }
                      />
                    </div>
                  ) : (
                    `${owner?.ownerfirstname} ${owner?.ownerlastname}`
                  )}
                </Heading>
              </div>
            </div>
          </div>

          <div className="flex w-[92%] flex-col gap-[43px] md:w-full md:px-5">
            <div className="ml-[9px] flex w-[85%] items-start justify-between gap-5 md:ml-0 md:w-full md:flex-col">
              <div className="flex w-[32%] flex-col items-start gap-[11px] md:w-full">
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px]"
                >
                  Address:{" "}
                  {isEditMode ? (
                    <input
                      ref={activeField === "owneraddress" ? activeFieldRef : null}
                      type="text"
                      className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                      value={owner?.owneraddress || ""} // Default to an empty string if undefined
                      onFocus={() => handleFieldFocus("owneraddress")}
                      onChange={(e) =>
                        setOwner((prevOwner) => {
                          if (!prevOwner) return null;
                          return {
                            ...prevOwner,
                            owneraddress: e.target.value,
                          };
                        })
                      }
                    />
                  ) : (
                    <span>{owner?.owneraddress || "N/A"}</span>
                  )}
                </Text>
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px]"
                >
                  Contact Number:{" "}
                  {isEditMode ? (
                    <input
                      ref={activeField === "ownercontact" ? activeFieldRef : null}
                      type="text"
                      className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                      value={owner?.ownercontact || ""} // Default to an empty string if undefined
                      onFocus={() => handleFieldFocus("ownercontact")}
                      onChange={(e) =>
                        setOwner((prevOwner) => {
                          if (!prevOwner) return null;
                          return {
                            ...prevOwner,
                            ownercontact: e.target.value,
                          };
                        })
                      }
                    />
                  ) : (
                    <span>{owner?.ownercontact || "N/A"}</span>
                  )}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {keyboardVisible && activeField && (
          <Keyboard onKeyPress={handleKeyboardInput} onClose={handleCloseKeyboard} />
        )}
      </div>
    </>
  );
};

export default OwnerDetailsPage;

