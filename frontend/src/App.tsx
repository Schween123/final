import { useEffect } from 'react'
import Routes from "./Routes";
import { BrowserRouter as Router } from "react-router-dom";


function App() {
  useEffect (()=> {
    console.log(import.meta.env.VITE_API_URL)
  }, [])

  
  return (
    <Router>
      <Routes/>
    </Router>
  );
}

export default App
