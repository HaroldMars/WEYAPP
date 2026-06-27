import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MobileShell from "./components/MobileShell.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ConversationPage from "./pages/ConversationPage.jsx";
import PostsPage from "./pages/PostsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PublicProfilePage from "./pages/PublicProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <MobileShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<ChatPage />} />
              <Route path="/chat/:id" element={<ConversationPage />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:id" element={<PublicProfilePage />} />
              <Route path="/menu" element={<SettingsPage />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
