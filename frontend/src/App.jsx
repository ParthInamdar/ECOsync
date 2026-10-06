import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Home from './pages/Home';
import SearchPage from './pages/resources/Search';
import AddResource from './pages/resources/AddResource';
import ResourceDetails from './pages/resources/ResourceDetails';
import MyRequests from './pages/profile/MyRequests';
import PublicProfile from './pages/profile/PublicProfile';
import MyImpact from './pages/profile/MyImpact';
import AdminDashboard from './pages/admin/AdminDashboard';
import Inbox from './pages/chat/Inbox';
import ChatRoom from './pages/chat/ChatRoom';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

const Layout = () => {
  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/messages/');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/add" element={
            <ProtectedRoute>
              <AddResource />
            </ProtectedRoute>
          } />
          
          <Route path="/requests" element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          } />
          
          <Route path="/impact" element={
            <ProtectedRoute>
              <MyImpact />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/messages" element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          } />
          
          <Route path="/messages/:id" element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } />
          
          <Route path="/resource/:id" element={<ResourceDetails />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isChatRoom && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}

export default App;
