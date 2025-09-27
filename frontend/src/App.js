import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import MainLayout from "./components/layout/MainLayout";
import Feed from "./components/feed/Feed";
import GaragesPage from "./components/garages/GaragesPage";
import { Toaster } from "./components/ui/sonner";

// Placeholder components for routes
const Popular = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Popular Posts</h1>
    <p className="text-gray-600">Trending posts coming soon...</p>
  </div>
);

const Rides = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Rides</h1>
    <p className="text-gray-600">Ride planning coming soon...</p>
  </div>
);

const Profile = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <p className="text-gray-600">Profile page coming soon...</p>
  </div>
);

const AuthenticatedApp = () => (
  <MainLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/popular" element={<Popular />} />
      <Route path="/garages" element={<GaragesPage />} />
      <Route path="/rides" element={<Rides />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </MainLayout>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AuthenticatedApp />
        </Layout>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
