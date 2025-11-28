import HomePage from './pages/HomePage';
import { useEffect, useState } from 'react';
import supabase from './services/service';
import type {User} from './types/general';
import { BrowserRouter, Routes, Route } from 'react-router';
import EventDetails from './pages/EventDetails';
import type {Event} from './types/general';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import CreateEvent from './pages/CreateEvent';
import { useNavigate } from 'react-router';
import Navbar from './components/Navbar';

function App() {

  
 
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/event/:eventId" element={<EventDetails/>} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create" element={<CreateEvent />} />
      </Routes>
    <Navbar></Navbar>

    </BrowserRouter>
    </>
  );
}

export default App;
