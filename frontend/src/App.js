import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import Feed from "./components/feed/Feed";
import { Toaster } from "./components/ui/sonner";

// Placeholder components for routes
const Garages = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Garages</h1>
    <p className="text-gray-600">Garage management coming soon...</p>
  </div>
);

const Profile = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <p className="text-gray-600">Profile page coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/garages" element={<Garages />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
