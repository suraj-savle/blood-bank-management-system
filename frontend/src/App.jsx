import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import LandingPage from "./pages/Landing";
import FacilityForm from "./pages/auth/FacultyRegister";
import DonorRegister from "./pages/auth/DonorRegister";
import DonorDashboard from "./pages/donor/DonorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layouts/DashboardLayout";
import DonorProfile from "./pages/donor/DonorProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFacilities from "./pages/admin/AdminFacilities";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import BloodCamps from "./pages/bloodlab/BloodCamps";
import BloodlabDashboard from "./pages/bloodlab/BloodlabDashboard";
import BloodStock from "./pages/bloodlab/BloodStock";
import LabProfile from "./pages/bloodlab/LabProfile";
import AdminDonors from "./pages/admin/GetAllDonors";

function App() {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register/donor" element={<DonorRegister />} />
        <Route path="/register/facility" element={<FacilityForm />} />
        <Route path="/login" element={<Login />} />

        <Route path="/donor" element={<ProtectedRoute><DashboardLayout userRole="donor" /></ProtectedRoute>}>
          <Route index element={<DonorDashboard />} />
          <Route path="profile" element={<DonorProfile />} />
        </Route>
      
        <Route path="/hospital" element={<ProtectedRoute><DashboardLayout userRole="hospital" /></ProtectedRoute>}>
          <Route index element={<HospitalDashboard />} />
       </Route>
      
        <Route path="/lab" element={<ProtectedRoute><DashboardLayout userRole="blood-lab" /></ProtectedRoute>}>
          <Route index element={<BloodlabDashboard />} />
          <Route path="inventory" element={<BloodStock />} />
          <Route path="camps" element={<BloodCamps />} />
          <Route path="profile" element={<LabProfile />} />
        </Route>
        
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout userRole="admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="verification" element={<AdminFacilities />} />
          <Route path="donors" element={<AdminDonors />} />
        </Route>
      </Routes>
  );
}

export default App;
