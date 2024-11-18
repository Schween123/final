import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BoarderFaceRegistration = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { tenantId } = location.state || {}; // Extract tenantId from the navigation state
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null); // To store captured image URL

    useEffect(() => {
        const startCamera = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
        };

        startCamera();

        return () => {
            // Cleanup: Stop all media tracks when the component is unmounted
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = async () => {
    if (videoRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        try {
            const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

            if (imageBlob) {
                const imageUrl = URL.createObjectURL(imageBlob);
                setImage(imageUrl); // Display captured image

                // Upload the image to the backend
                const uploadData = new FormData();
                uploadData.append('image', imageBlob, `${tenantId}.jpg`); // Include tenant ID and image
                uploadData.append('tenantId', tenantId);

                try {
                    const response = await fetch('http://127.0.0.1:8000/api/boarder_face_register/', {
                        method: 'POST',
                        body: uploadData,
                    });

                    if (response.ok) {
                        console.log('Image path saved successfully');

                        // Clean up the camera
                        if (videoRef.current && videoRef.current.srcObject) {
                            const stream = videoRef.current.srcObject;
                            const tracks = stream.getTracks();
                            tracks.forEach(track => track.stop());
                        }

                        // Redirect upon success
                        navigate("/boarderregistrationsuccessful", { state: { tenantId } });
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to save image path:', errorData.message);
                    }
                } catch (error) {
                    console.error('Error saving image path:', error);
                }
            } else {
                console.error("Failed to create image blob");
            }
        } catch (error) {
            console.error("Error capturing image:", error);
        }
    } else {
        console.error("Video reference is not available");
    }
};


    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Face Registration</h1>
            <div className="w-full max-w-lg flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay className="w-full rounded-lg shadow-lg border-2 border-gray-300" />
                <canvas ref={canvasRef} className="hidden" />
                {image && (
                    <img
                        src={image}
                        alt="Captured"
                        className="w-full mt-4 rounded-lg shadow-lg border-2 border-gray-300"
                    />
                )}
            </div>
            <button
                onClick={handleCapture}
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
                Capture Image
            </button>
        </div>
    );
};

export default BoarderFaceRegistration;
