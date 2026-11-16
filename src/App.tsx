import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { CitizenLogin } from '@/pages/CitizenLogin';
import { CitizenRegister } from '@/pages/CitizenRegister';
import { CitizenReport } from '@/pages/CitizenReport';
import { ControlRoom } from '@/pages/ControlRoom';
import { ControlRoomLogin } from '@/pages/ControlRoomLogin';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ControlRoomProtectedRoute } from '@/components/ControlRoomProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/citizen/login" element={<CitizenLogin />} />
          <Route path="/citizen/register" element={<CitizenRegister />} />
          <Route
            path="/citizen/report"
            element={
              <ProtectedRoute>
                <CitizenReport />
              </ProtectedRoute>
            }
          />
          <Route path="/control-room/login" element={<ControlRoomLogin />} />
          <Route
            path="/control-room"
            element={
              <ControlRoomProtectedRoute>
                <ControlRoom />
              </ControlRoomProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
