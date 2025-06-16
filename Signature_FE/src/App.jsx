import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import Dashboard from "./pages/Dashboard";
import FileUpload from "./pages/FileUpload";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./components/Profile";

import { logout, getUserProfile, updateUserProfile, getPublicCert, getPrivateCert } from "./api";


function App() {
  const [activePath, setActivePath] = useState("/");
  const [currentView, setCurrentView] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Check authentication on initial load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');

    if (token && userId) {
      setIsAuthenticated(true);
      setUser({ user_id: userId });
      handleNavigate("/dashboard");
      loadUserProfile(userId);
    }
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const data = await getUserProfile(userId);
      setProfileData(data);

    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleNavigate = (path) => {
    setActivePath(path);
    if (path === "/dashboard") {
      setCurrentView("dashboard");
    } else if (path === "/documents") {
      setCurrentView("fileupload");
    } else if (path === "/profile") {
      setCurrentView("profile");
    } else {
      setCurrentView("home");
    }
  };

  const handleLogin = async (tokenResponse) => {
    setIsAuthenticated(true);

    const decodedToken = jwtDecode(tokenResponse.access_token)

    setUser({ user_id: decodedToken.sub }); // sub chính là user_id từ token
    await loadUserProfile(decodedToken.sub);
    handleNavigate("/dashboard");
  };

  const handleSignUp = async (tokenResponse) => {
    // Token đã được lưu trong api.js qua storeAuthData
    setIsAuthenticated(true);
    setUser({ user_id: tokenResponse.sub });
    await loadUserProfile(tokenResponse.sub);
    handleNavigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout(); // Gọi API logout
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Luôn clear state và local storage
      setIsAuthenticated(false);
      setUser(null);
      setProfileData(null);
      handleNavigate("/");
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const data = await updateUserProfile(user.user_id, updatedData);
      setProfileData(data);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <Home
          onLoginClick={() => setShowLogin(true)}
          onSignUpClick={() => setShowSignUp(true)}
        />
      ) : (
        <div className="flex flex-col">
          <Header
            activePath={activePath}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            user={profileData}
          />

          <main className="flex-1 p-6">
            {currentView === "dashboard" && (
              <Dashboard
                activePath={activePath}
              />
            )}

            {currentView === "fileupload" && (
              <FileUpload
                setSelectedFile={setSelectedFile}
                user={user}
              />
            )}

            {currentView === "profile" && (
              <Profile
                user={profileData || user}
                getPublicCert={getPublicCert}
                getPrivateCert={getPrivateCert}
                onUpdate={handleProfileUpdate}
              />
            )}
          </main>
        </div>
      )}

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLogin}
          onSignUpClick={() => {
            setShowLogin(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUp
          onClose={() => setShowSignUp(false)}
          onSignUpSuccess={handleSignUp}
          onLoginClick={() => {
            setShowSignUp(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}

export default App;