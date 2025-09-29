import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import MainLayout from "./components/layout/MainLayout";
import Feed from "./components/feed/Feed";
import FeedLayout from "./components/feed/FeedLayout";
import ResponsiveFeedPage from "./components/feed/ResponsiveFeedPage";
import GaragesPage from "./components/garages/GaragesPage";
import ProfilePage from "./components/profile/ProfilePage";
import { Toaster } from "./components/ui/sonner";
import { SOCIAL_CONFIG } from "./config/social-config";

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

const Profile = () => <ProfilePage />;

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/feed" replace />} />
    <Route path="/feed" element={<ResponsiveFeedPage />} />
    <Route path="/classic-feed" element={<MainLayout><Feed /></MainLayout>} />
    <Route path="/popular" element={<MainLayout><Popular /></MainLayout>} />
    <Route path="/garages" element={<MainLayout><GaragesPage /></MainLayout>} />
    <Route path="/rides" element={<MainLayout><Rides /></MainLayout>} />
    <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
  </Routes>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={SOCIAL_CONFIG.google.clientId}>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <AuthenticatedApp />
          </Layout>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
