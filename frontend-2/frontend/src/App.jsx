import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CompanyRegister from './components/Auth/CompanyRegister';
import ActivityList from './components/Dashboard/ActivityList';
import Analytics from './components/Dashboard/Analytics';
import Recommendations from './components/Dashboard/Recommendations';
import ImportHub from './components/Dashboard/ImportHub';
import LandingPage from './components/Landing/LandingPage';
import AboutPage from './components/Landing/AboutPage';
import ContactPage from './components/Landing/ContactPage';
import FAQPage from './components/Landing/FAQPage';
import ResourcesPage from './components/Landing/ResourcesPage';
import ModulesPage from './components/Landing/ModulesPage';
import PrivateRoute from './components/PrivateRoute';
import Goals from './components/Dashboard/Goals';
import Reports from './components/Dashboard/Reports';
import Benchmarks from './components/Dashboard/Benchmarks';
import WaterManagement from './components/Dashboard/WaterManagement';
import WasteManagement from './components/Dashboard/WasteManagement';
import Scope3Dashboard from './components/Dashboard/Scope3Dashboard';
import EmissionCalculator from './components/Dashboard/EmissionCalculator';
import Settings from './components/Dashboard/Settings';

import Dashboard from './components/Dashboard/Dashboard2';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/company-register" element={<CompanyRegister />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><ImportHub /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><ImportHub /></PrivateRoute>} />
          <Route path="/bulk" element={<PrivateRoute><ImportHub /></PrivateRoute>} />
          <Route path="/activities" element={<PrivateRoute><ActivityList /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/benchmarks" element={<PrivateRoute><Benchmarks /></PrivateRoute>} />
          <Route path="/water" element={<PrivateRoute><WaterManagement /></PrivateRoute>} />
          <Route path="/waste" element={<PrivateRoute><WasteManagement /></PrivateRoute>} />
          <Route path="/scope3" element={<PrivateRoute><Scope3Dashboard /></PrivateRoute>} />
          <Route path="/calculator" element={<PrivateRoute><EmissionCalculator /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;