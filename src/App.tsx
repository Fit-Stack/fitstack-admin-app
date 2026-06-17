import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './contexts/ToastContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailsPage from './pages/SessionDetailsPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import UserDetailsPage from './pages/UserDetailsPage';
import TrainersPage from './pages/TrainersPage';
import TrainerDetailsPage from './pages/TrainerDetailsPage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceProductDetailsPage from './pages/MarketplaceProductDetailsPage';
import EnquiriesPage from './pages/EnquiriesPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import UsersPage from './pages/UsersPage';
import MembershipPage from './pages/MembershipPage';

function App() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        
        <Route
          path="/"
          element={
            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:id" element={<ClassDetailsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<SessionDetailsPage />} />
          <Route path="trainers" element={<TrainersPage />} />
          <Route path="trainers/:id" element={<TrainerDetailsPage />} />
          <Route path="users" element={<UsersPage   />} />
          <Route path="users/:id" element={<UserDetailsPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="marketplace/:id" element={<MarketplaceProductDetailsPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
