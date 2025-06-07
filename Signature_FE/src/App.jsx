import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import FileUpload from "./pages/FileUpload";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

function App() {
  const [activePath, setActivePath] = useState("/");
  const [currentView, setCurrentView] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user'); // phải sửa cái này
    console.log(token)
    console.log(userData)

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      handleNavigate("/dashboard");
    }
  }, []);

  const handleNavigate = (path) => {
    setActivePath(path);
    if (path === "/dashboard") {
      setCurrentView("dashboard");
    } else if (path === "/documents") {
      setCurrentView("fileupload");
    } else {
      setCurrentView("home");
    }
  };

  const handleLogin = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); // cái này nữa
    setShowLogin(false);
    handleNavigate("/dashboard");
  };

  const handleSignUp = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); // cái này nữa
    setShowSignUp(false);
    handleNavigate("/dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    handleNavigate("/");
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
            user={user}
          />

          <main className="flex-1 p-6">
            {currentView === "dashboard" && (
              <Dashboard
                activePath={activePath}
                user={user}
              />
            )}

            {currentView === "fileupload" && (
              <FileUpload
                setSelectedFile={setSelectedFile}
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