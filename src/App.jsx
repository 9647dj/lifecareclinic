import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Admin from './pages/Admin';
import CallbackButton from './components/CallbackButton';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
        <Footer />
        <CallbackButton />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}
