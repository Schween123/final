import { Text, Heading } from "../../../components";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import DeleteConfirmationModal from "../../../components/DeleteConfirmationModal/DeleteConfirmationModal"; // Import the DeleteConfirmationModal
import Keyboard from "../../../components/Keyboard/Keyboard"; // Import keyboard component



const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0; 
    overflow-y: scroll;
  }
  
  #root, .app {
    height: 1291px;
    
  }
`;

// Define the interface for tenant and guardian
interface Guardian {
  id: number;
  guardianfirstname: string;
  guardianmiddlename: string;
  guardianlastname: string;
  guardiancontactnumber: string;
  guardianaddress: string;
  relationship: string;
  tenant: number;
}

interface Tenant {
  id: string;
  boarderfirstname: string;
  boardermiddlename: string;
  boarderlastname: string;
  boarderaddress: string;
  boarderage: number;
  boardergender: string;
  boardercontactnumber: string;
  boardercourse_profession: string;
  boarderinstitution: string;
}

const BoarderDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>(); // Use useParams to get tenantId
  const [tenant, setTenant] = useState<Tenant | null>(null); // State to hold tenant data
  const [filteredGuardians, setFilteredGuardians] = useState<Guardian[]>([]); // State to hold filtered guardians data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const [error, setError] = useState<string | null>(null); // State to manage errors
  const [isEditMode, setIsEditMode] = useState(false); // To track edit mode
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Control modal visibility
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
   
  const [guardianEditData, setGuardianEditData] = useState<{
    [key: number]: string;
  }>({}); // To manage the guardian data being edited



  // Fetch tenant and guardian data based on tenantId
  useEffect(() => {
    const fetchDetails = async () => {
      if (!tenantId) {
        console.warn("No tenantId provided");
        return;
      }

      console.log("Fetching details for tenantId:", tenantId); // Check tenantId value

      try {
        // Fetch tenant details
        const tenantResponse = await axios.get(
          `http://127.0.0.1:8000/api/tenant/${tenantId}`
        );
        console.log("Tenant data:", tenantResponse.data); // Log tenant data
        setTenant(tenantResponse.data); // Set the tenant data

        // Fetch all guardian details
        const guardianResponse = await axios.get(
          `http://127.0.0.1:8000/api/guardian/?tenant=${tenantId}`
        );
        console.log("Guardian data:", guardianResponse.data); // Log guardian data

        // Filter guardians related to the selected tenant
        const tenantGuardians = guardianResponse.data.filter(
          (guardian: Guardian) => guardian.tenant === parseInt(tenantId)
        );
        setFilteredGuardians(tenantGuardians);

        setIsLoading(false); // Set loading to false once both requests are complete
      } catch (err) {
        console.error("Error fetching data:", err); // Log any errors
        setError("Failed to fetch data"); // Handle any errors
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [tenantId]); // Dependency array ensures this runs when tenantId changes

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
    try {
      // Call the API to update tenant details
      await axios.put(`http://127.0.0.1:8000/api/tenant/${tenantId}/`, tenant);

      // Call the API to update guardians' contact numbers using PATCH
      await Promise.all(
        filteredGuardians.map(async (guardian) => {
          if (guardian.id in guardianEditData) {
            await axios.patch(
              `http://127.0.0.1:8000/api/guardian/${guardian.id}/`,
              { guardiancontactnumber: guardianEditData[guardian.id] } // Only update guardiancontactnumber
            );
          }
        })
      );

      setIsEditMode(false); // Disable edit mode after saving
      setGuardianEditData({}); // Clear the guardian edit data
    } catch (err) {
      console.error("Failed to update details", err);
    }
  };

  const handleButtonClick = () => {
    navigate(-1);
    // Navigate back to boardersinfo
  };

  const handleGuardianEditChange = (guardianId: number, value: string) => {
    setGuardianEditData((prev) => ({
      ...prev,
      [guardianId]: value,
    }));
    // Update filteredGuardians state to reflect the changes immediately
    setFilteredGuardians((prevGuardians) =>
      prevGuardians.map((guardian) =>
        guardian.id === guardianId
          ? { ...guardian, guardiancontactnumber: value }
          : guardian
      )
    );
  };



  
  const handleKeyboardInput = (value: string) => {
  document.activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
  // Function to update field based on the input value
  const updateField = (current: string, input: string) => {
    if (input === "Backspace") {
      return current.slice(0, -1); // Remove only the last character
    } else if (input === "Enter") {
      return current; // No action on enter
    } else {
      return current + input; // Append the new input character
    }
  };

  // Convert to title case
  const toTitleCase = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const isValidContactInput = (input: string, current: string) => {
    // Ensure it's a digit, starts with "09", and doesn't exceed 11 digits
    const updatedValue = updateField(current, input);
    return /^[0-9]$/.test(input) &&
           (updatedValue.length <= 11) &&
           (updatedValue.length < 2 || updatedValue.startsWith("09"));
  };

  const isValidTextInput = (input: string) => /^[a-zA-Z\s]$/.test(input); // Only allow letters and spaces

  // Use setTenant to update the state based on activeInput field
  setTenant((prev) => {
    if (!prev) return null;

    let updatedValue;

    switch (activeInput) {
      case "tenantContact":
        // Validate input for contact number
        if (value === "Backspace" || isValidContactInput(value, prev.boardercontactnumber)) {
          updatedValue = updateField(prev.boardercontactnumber, value);
          return { ...prev, boardercontactnumber: updatedValue };
        }
        return prev; // Ignore invalid input for contact number

      case "tenantCourse":
      case "tenantInstitution":
        // Only allow letters and spaces, and auto-capitalize input
        if (value === "Backspace" || isValidTextInput(value)) {
          const fieldKey = activeInput === "tenantCourse" ? "boardercourse_profession" : "boarderinstitution";
          updatedValue = toTitleCase(updateField(prev[fieldKey], value));
          return { ...prev, [fieldKey]: updatedValue };
        }
        return prev; // Ignore invalid input for course and institution fields

      default:
        // Check if it’s a guardian contact input
        if (activeInput?.startsWith("guardianContact_")) {
          const guardianId = parseInt(activeInput.split("_")[1]);

          // Validate input for guardian contact number
          if (value === "Backspace" || isValidContactInput(value, guardianEditData[guardianId] || "")) {
            const updatedGuardianContact = updateField(guardianEditData[guardianId] || "", value);
            setGuardianEditData((prevData) => ({
              ...prevData,
              [guardianId]: updatedGuardianContact,
            }));

            setFilteredGuardians((prevGuardians) =>
              prevGuardians.map((guardian) =>
                guardian.id === guardianId
                  ? { ...guardian, guardiancontactnumber: updatedGuardianContact }
                  : guardian
              )
            );
          }
          return prev; // Return tenant unchanged
        }
        return prev;
    }
  });
};










  if (isLoading) {
    return <p>Loading...</p>; // Show loading state
  }

  if (error) {
    return <p>Error: {error}</p>; // Show error message if there's an issue
  }

  const handleDeleteTenant = async () => {
  try {
    console.log("Tenant data:", tenant);

    if (!tenantId) {
      console.error("Tenant ID is undefined.");
      return;
    }

    // Access the image path from the tenant object
    const imagePath = tenant.boarder_face; // Retrieve the path stored in boarder_face
    console.log("Image path:", imagePath); // Log the image path

    // Step 1: Fetch all transactions associated with the tenant
    const transactionsResponse = await axios.get(
      `http://127.0.0.1:8000/api/transactions/?tenantId=${tenantId}`
    );

    // Step 2: Delete each transaction individually
    const deleteTransactionPromises = transactionsResponse.data.map(
      async (transaction: { id: number }) => {
        await axios.delete(
          `http://127.0.0.1:8000/api/transactions/${transaction.id}/`
        );
      }
    );
    await Promise.all(deleteTransactionPromises);

    // Step 3: Fetch all guardians associated with the tenant
    const guardiansResponse = await axios.get(
      `http://127.0.0.1:8000/api/guardian/?tenant=${tenantId}`
    );

    // Check if the response contains only the guardians associated with the tenant
    const tenantGuardians = guardiansResponse.data.filter(
      (guardian: { tenant: number }) => guardian.tenant === parseInt(tenantId)
    );

    if (tenantGuardians.length === 0) {
      console.warn("No guardians found for this tenant.");
    }

    // Step 4: Delete each guardian associated with the tenant individually
    const deleteGuardianPromises = tenantGuardians.map(
      async (guardian: { id: number }) => {
        await axios.delete(
          `http://127.0.0.1:8000/api/guardian/${guardian.id}/`
        );
      }
    );
    await Promise.all(deleteGuardianPromises);

    // Step 5: Delete the image associated with the tenant
    if (imagePath) {
      await axios.delete(`http://127.0.0.1:8000/api/delete-image/`, {
        data: { imagePath }, // Send the image path to the backend
      });
      console.log("Image deleted successfully:", imagePath);
    } else {
      console.warn("No image path available for deletion.");
    }

    // Step 6: Finally, delete the tenant
    await axios.delete(`http://127.0.0.1:8000/api/tenant/${tenantId}/`);

    // Step 7: Redirect back to the boarders list
    navigate(-1);
  } catch (error) {
    console.error("Failed to delete tenant", error);
  }
};




const handleCloseKeyboard = () => {
    setShowKeyboard(false); // Close the keyboard
    setActiveInput(null); // Reset the active input
};




  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <style>{globalStyles}
        </style>
      </Helmet>
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onConfirm={handleDeleteTenant}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
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
                  <button
                    className="p-5 cursor-pointer"
                    onClick={() => setShowDeleteModal(true)} // Show modal on click
                  >
                    <img
                      src="/images/trash.png"
                      alt="Trash"
                      className="h-[40px] w-[40px]"
                    />
                  </button>
                </div>
              </header>
              <div className="container-xs flex flex-col items-center gap-2 px-[301px] md:px-5">
                <Heading
                  size="xl"
                  as="h1"
                  className="!font-semibold tracking-[4.50px] !text-white"
                >
                  {tenant?.boarderfirstname} {tenant?.boardermiddlename}{" "}
                  {tenant?.boarderlastname}
                </Heading>
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px] !text-gray-300"
                >
                  {tenant?.boarderaddress}
                </Text>
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
                  Age: {tenant?.boarderage}
                </Text>
                <div className="flex flex-col items-start gap-4 self-stretch">
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Gender: {tenant?.boardergender}
                  </Text>
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Contact Number:{" "}
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                        value={tenant?.boardercontactnumber || ""} // Default to an empty string if undefined
                        onClick={() => { setShowKeyboard(true); setActiveInput("tenantContact");
                        document.activeElement.scrollIntoView({ behavior: "smooth", block: "center" });}}
                        onChange={(e) =>
                          setTenant((prevTenant) => {
                            if (!prevTenant) return null; // Ensure prevTenant is defined
                            return {
                              ...prevTenant,
                              boardercontactnumber: e.target.value, // Update contact number
                            };
                          })
                        }
                      />
                    ) : (
                      <span>{tenant?.boardercontactnumber || "N/A"}</span> // Display "N/A" if contact number is undefined
                    )}
                  </Text>
                </div>
              </div>
              <div className="flex flex-col items-start gap-[19px]">
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px]"
                >
                  Course/Profession:{" "}
                  {isEditMode ? (
                    <input
                      type="text"
                      className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                      value={tenant?.boardercourse_profession || ""} // Default to an empty string if undefined
                      onClick={() => { setShowKeyboard(true); setActiveInput("tenantCourse");
                      document.activeElement.scrollIntoView({ behavior: "smooth", block: "center" });}}
                      onChange={(e) =>
                        setTenant((prevTenant) => {
                          if (!prevTenant) return null; // Ensure prevTenant is defined
                          return {
                            ...prevTenant,
                            boardercourse_profession: e.target.value, // Update course/profession
                          };
                        })
                      }
                    />
                  ) : (
                    <span>{tenant?.boardercourse_profession || "N/A"}</span> // Display "N/A" if course/profession is undefined
                  )}
                </Text>
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px]"
                >
                  Institution:{" "}
                  {isEditMode ? (
                    <input
                      type="text"
                      className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                      value={tenant?.boarderinstitution || ""} // Default to an empty string if undefined
                      onClick={() => { setShowKeyboard(true); setActiveInput("tenantInstitution");
                      document.activeElement.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                      onChange={(e) =>
                        setTenant((prevTenant) => {
                          if (!prevTenant) return null; // Ensure prevTenant is defined
                          return {
                            ...prevTenant,
                            boarderinstitution: e.target.value, // Update institution
                          };
                        })
                      }
                    />
                  ) : (
                    <span>{tenant?.boarderinstitution || "N/A"}</span> // Display "N/A" if institution is undefined
                  )}
                </Text>
              </div>
            </div>

            {/* Display guardians */}
            <div className="flex flex-col gap-[42px]">
              <div className="flex flex-col items-start gap-3.5">
                <div className="h-[2px] w-full self-stretch bg-customcyan" />
                <Heading
                  size="s"
                  as="h2"
                  className="ml-[9px] !font-semibold tracking-[3.60px] !text-customcyan md:m1-0"
                >
                  GUARDIAN
                </Heading>
              </div>
              {filteredGuardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="ml-[9px] flex flex-col items-start gap-[17px] md:m1-0"
                >
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Name: {guardian?.guardianfirstname}{" "}
                    {guardian?.guardianmiddlename} {guardian?.guardianlastname}
                  </Text>
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Address: {guardian?.guardianaddress}
                  </Text>
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Contact Number:{" "}
                    {isEditMode ? (
                      <input
                        type="text"
                        className="w-[660px] border-b-2 border-customcyan text-2xl inline-block bg-transparent text-customcyan"
                        value={
                          guardianEditData[guardian.id] ||
                          guardian.guardiancontactnumber
                        }
                        onClick={() => { setShowKeyboard(true); setActiveInput(`guardianContact_${guardian.id}`);
                        document.activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
                         }}
                        onChange={(e) =>
                          handleGuardianEditChange(guardian.id, e.target.value)
                        }
                      />
                    ) : (
                      <span>{guardian?.guardiancontactnumber || "N/A"}</span>
                    )}
                  </Text>
                  <Text
                    size="xl"
                    as="p"
                    className="!font-montserrat tracking-[3.50px]"
                  >
                    Relationship: {guardian?.relationship}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
       {showKeyboard && activeInput && (
    <Keyboard onKeyPress={handleKeyboardInput} onClose={handleCloseKeyboard} />
       )}
    </>
  );
};

export default BoarderDetailsPage;
