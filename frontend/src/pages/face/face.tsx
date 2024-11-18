import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FaceRecognitionComponent() {
    const navigate = useNavigate();
    const [isLive, setIsLive] = useState(false);
    const [detectedFace, setDetectedFace] = useState<string | null>(null);
    const [detectedStatus, setDetectedStatus] = useState<string | null>(null); // Track status

    const startLiveFeed = async () => {
        const response = await fetch('http://localhost:8000/api/start-live-feed/', { method: 'GET' });
        if (response.ok) {
            setIsLive(true);
            console.log('Live feed started in the background.');

            // Get the detected face and status from the response
            const data = await response.json();
            if (data.name && data.status) {
                console.log('Detected face:', data.name, 'Status:', data.status); // Log the detected face and status
                setDetectedFace(data.name); // Set the detected face in state
                setDetectedStatus(data.status); // Set the detected status in state

                // Navigate to the dashboard if it's an owner, otherwise navigate to the login page
                if (data.status === 'owner') {
                    navigate("/dashboard");
                } else if (data.status === 'tenant') {
                    navigate("/login", { state: { tenantId: data.name } });
                }
            }
        } else {
            console.error('Failed to start live feed');
        }
    };

    useEffect(() => {
        // Automatically start the live feed when the component mounts
        startLiveFeed();
    }, []);

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Face Recognition in Progress...</h2>
            {isLive && <p>Face recognition is running. Check the console for detected face.</p>}
            {detectedFace && (
                <p>Detected Face: {detectedFace} ({detectedStatus})</p>
            )}
        </div>
    );
}

export default FaceRecognitionComponent;
