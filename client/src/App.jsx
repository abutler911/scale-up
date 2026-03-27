import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Sessions from "./pages/Sessions.jsx";
import Repertoire from "./pages/Repertoire.jsx";
import Goals from "./pages/Goals.jsx";
import Stats from "./pages/Stats.jsx";

function ProtectedRoute({ children }) {
  const { verified, loading } = useAuth();
  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f0f",
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3">🎹</div>
          <p className="text-[#555] text-sm">Loading ScaleUp!...</p>
        </div>
      </div>
    );
  return verified ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="repertoire" element={<Repertoire />} />
            <Route path="goals" element={<Goals />} />
            <Route path="stats" element={<Stats />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
