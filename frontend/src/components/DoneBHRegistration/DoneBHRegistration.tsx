import { useNavigate } from 'react-router-dom';

const DoneBHRegistration = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  const handleNxtBtnClick = () => {
    onClose(); // Close the pop-up first
    setTimeout(() => {
      navigate('/boarderregistration'); // Adjust the path if needed
    }, 3000);
    navigate('/splashscreen'); // Redirect to splash screen
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">You're all set</h2>
        <button onClick={handleNxtBtnClick} className="bg-transparent border-none cursor-pointer">
          <img src="public/images/nxtbtn2.png" alt="Next" />
        </button>
      </div>
    </div>
  );
};

export default DoneBHRegistration;
