import HomePage from './pages/HomePage';
import { BrowserRouter, Routes, Route } from 'react-router';
import EventDetails from './pages/EventDetails';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import CreateEvent from './pages/CreateEvent';
import Navbar from './components/Navbar';
import EventPage from './pages/EventsPage';
import EventDetailsRedirectToMap from './pages/EventDetailsRedirectToMap';
import ProfilePage from './pages/ProfilePage';

function App() {

  
 
  return (
    <div className="font-display">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/events/map/:eventId" element={<EventDetailsRedirectToMap/>} />
        <Route path="/events/:eventId" element={<EventDetails/>} />
        <Route path="/events" element={<EventPage/>} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    <Navbar></Navbar>

    </BrowserRouter>
    </div>
  );
}

export default App;
