import { Helmet } from "react-helmet";
import { Text, Heading, Input, Button } from "../../../components";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Keyboard from '../../../components/Keyboard/Keyboard';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // You can use Font Awesome for eye icons

const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0;
  }
  #root, .app {
    height: 100%;
    overflow-y: auto; /* Enable scrolling */
  }
`;

export default function Login() {
  const [passcode, setPasscode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, firstName } = location.state || {};

  const errorRef = useRef<HTMLParagraphElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstName) {
      console.log("First Name:", firstName);
    }
  }, [firstName]);

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus(); // Ensure the input regains focus
    setKeyboardVisible(true); // Show keyboard
  };

  const handleKeyboardInput = (key: string) => {
    if (key === 'Enter') {
      setKeyboardVisible(false);
      handleLogin();
    } else if (key === 'Backspace') {
      setPasscode((prev) => prev.slice(0, -1));
    } else if (/^[0-9]$/.test(key) && passcode.length < 4) {
      setPasscode((prev) => prev + key);
    }
  };

  const handlePasscodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (/^[0-9]*$/.test(input) && input.length <= 4) {
      setPasscode(input);
    } else {
      setError("Only numbers are allowed and up to 4 digits only.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setError(""), 2000);
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword); // Toggle visibility
  };

  const handleLogin = async () => {
    if (passcode.length !== 4) {
      setError("Passcode must be 4 digits");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/tenant/verify-passcode/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tenantId, passcode }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        navigate(`/boarderprofile/${data.tenantId}`, { state: { firstName: data.boarderfirstname } });
      } else {
        setError("Wrong password, try again");
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (error) {
      setError("An error occurred while trying to log in.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setLoading(false);
    }
  };
  
    // Handle "Back" button click
  const handleButtonClick = () => {
    navigate(`/splashscreen`);
  };

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full border border-solid border-white-A700 pb-[195px] md:pb-5">
        <div className="flex flex-col items-center">
          <div className="flex h-[630px] items-start self-stretch bg-[url(/images/BoarderProfilebg.svg)] bg-cover bg-no-repeat p-[50px] md:h-auto">
            <div className="mb-[243px] ml-[15px] flex w-[63%] flex-col items-start gap-[54px] md:ml-0 md:w-full sm:gap-[27px]">
            
              <div className="flex w-[44%] flex-col items-center self-end md:w-full">
                <div className="flex flex-wrap items-center justify-center gap-5 self-stretch">
         
                  <Heading
                    size="lg"
                    as="h2"
                    className="!font-semibold tracking-[5.00px] !text-white"
                  >
                    Hello, {firstName || "Good Day!"}
                  </Heading>
                </div>
   
                <Text
                  size="xl"
                  as="p"
                  className="!font-montserrat tracking-[3.50px] !text-gray-300"
                >
                  Login to your Profile
                </Text>
              </div>
            </div>
          </div>
          <div className="!self-start sm:self-auto absolute mt-[10px] ml-[10px]">
           <button
                onClick={handleButtonClick}
                className="p-5 cursor-pointer"
              >
                <img src="/images/backbtn.png" alt="arrowleft" className="h-[25px] w-[25px]"/>
              </button>
            </div>
          <div className="container relative mt-[-197px] px-[187px] md:p-5 md:px-5 max-w-[900px] h-[396px] mx-auto">
            <div className="flex flex-col items-center gap-[53px] border-[5px] border-solid border-gray-400 bg-gray-300 p-[39px] shadow-lg sm:gap-[26px] sm:p-5">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="self-stretch pt-4">
                <div className="flex flex-col gap-[21px]">
                  <div className="flex items-start justify-between gap-5 md:flex-col">
                    <div className="flex w-[55%] flex-col gap-[38px] md:w-full">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex w-full items-center gap-1">
                          <div
                            className="absolute right-16 top-[90px] transform -translate-y-1/2 cursor-pointer"
                            onClick={handlePasswordToggle}
                          >
                            {showPassword ? (
                              <FaEyeSlash className="text-gray-500" size={20} />
                            ) : (
                              <FaEye className="text-gray-500" size={20} />
                            )}
                          </div>
                          <Input
                            ref={inputRef}
                            variant="fill"
                            shape="round"
                            type={showPassword ? "text" : "password"}
                            name="passcode"
                            value={passcode}
                            onChange={handlePasscodeChange}
                            onFocus={scrollToInput}
                            onClick={scrollToInput} // Ensure it scrolls and keyboard pops up
                            placeholder="Please enter passcode"
                            className="w-full rounded-[20px] px-[21px] py-[10px] !font-montserrat bg-customdarkgray4 text-[25px]"
                          />
                        </div>
                      </div>
                      {error && <p ref={errorRef} className="text-red-500">{error}</p>}
                      {loading && <p>Loading...</p>}
                      <Button
                        type="submit"
                        className="mt-4 w-full py-2 bg-customcyan text-white rounded-[20px] !font-montserrat"
                      >
                        Login
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
              {keyboardVisible && (
                <div ref={keyboardRef}>
                  <Keyboard
                    onKeyPress={handleKeyboardInput}
                    onClose={() => setKeyboardVisible(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
