import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { SubjectLibraryPage } from './pages/SubjectLibraryPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { AITutorPage } from './pages/AITutorPage';
import { PDFAnalyzerPage } from './pages/PDFAnalyzerPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { WeakTopicDetectionPage } from './pages/WeakTopicDetectionPage';
import { ProgressAnalyticsPage } from './pages/ProgressAnalyticsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { TeacherAdminPage } from './pages/TeacherAdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { GraduationCap } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // States passed between features
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [pdfTextForQuiz, setPdfTextForQuiz] = useState<string>('');
  const [pdfTitleForQuiz, setPdfTitleForQuiz] = useState<string>('');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection and redirection guards
  useEffect(() => {
    const isRecovery =
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery');

    if (isRecovery) {
      if (currentPath !== '/forgot-password') {
        navigate('/forgot-password');
      }
      return;
    }

    if (loading) return;

    // If logged-in user visits auth pages, redirect to dashboard
    if (user && (currentPath === '/login' || currentPath === '/register')) {
      navigate('/app/dashboard');
    }
    // If unauthenticated user tries to directly access protected /app/* routes, redirect to login
    else if (!user && currentPath.startsWith('/app')) {
      navigate('/login');
    }
  }, [user, loading, currentPath]);

  const handleAskAIWithQuery = (query: string) => {
    setAiInitialQuery(query);
    navigate('/app/ai-tutor');
  };

  const handleGenerateQuizFromPDF = (text: string, title: string) => {
    setPdfTextForQuiz(text);
    setPdfTitleForQuiz(title);
    navigate('/app/quiz');
  };

  // 1. Session Restoration Loading Screen (prevents flash of landing page or redirect flicker)
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wide">Restoring session...</p>
        </div>
      </div>
    );
  }

  // 2. Standalone Auth Pages
  if (currentPath === '/login') {
    return <LoginPage onNavigate={navigate} onSuccess={() => navigate('/app/dashboard')} />;
  }

  if (currentPath === '/register') {
    return <RegisterPage onNavigate={navigate} onSuccess={() => navigate('/app/dashboard')} />;
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPasswordPage onNavigate={navigate} />;
  }

  // 4. Public Landing Page (when on '/', or not logged in)
  if (currentPath === '/' || !currentPath.startsWith('/app') || !user) {
    return (
      <LandingPage
        onNavigate={navigate}
        onOpenAuth={() => navigate('/login')}
      />
    );
  }

  // 5. Application Protected Dashboard Shell
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex transition-colors duration-250">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={navigate}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPath === '/app/dashboard' && (
            <DashboardPage onNavigate={navigate} onAskAI={handleAskAIWithQuery} />
          )}

          {currentPath === '/app/subjects' && (
            <SubjectLibraryPage onNavigate={navigate} />
          )}

          {currentPath.startsWith('/app/subjects/') && (
            <SubjectDetailPage
              subjectId={currentPath.split('/app/subjects/')[1]}
              onNavigate={navigate}
              onAskAI={handleAskAIWithQuery}
            />
          )}

          {currentPath === '/app/ai-tutor' && (
            <AITutorPage
              initialQuery={aiInitialQuery}
              onClearInitialQuery={() => setAiInitialQuery('')}
            />
          )}

          {currentPath === '/app/pdf-analyzer' && (
            <PDFAnalyzerPage
              onNavigate={navigate}
              onGenerateQuizFromPDF={handleGenerateQuizFromPDF}
            />
          )}

          {currentPath === '/app/quiz' && (
            <QuizGeneratorPage
              initialPDFText={pdfTextForQuiz}
              initialPDFTitle={pdfTitleForQuiz}
              onNavigate={navigate}
            />
          )}

          {currentPath === '/app/planner' && <StudyPlannerPage />}

          {currentPath === '/app/weak-topics' && (
            <WeakTopicDetectionPage onNavigate={navigate} onAskAI={handleAskAIWithQuery} />
          )}

          {currentPath === '/app/progress' && <ProgressAnalyticsPage />}

          {currentPath === '/app/materials' && (
            <StudyMaterialsPage onNavigate={navigate} />
          )}

          {currentPath === '/app/admin' && <TeacherAdminPage />}

          {currentPath === '/app/profile' && <ProfilePage onNavigate={navigate} />}
        </main>
      </div>

      {/* Global Intelligent Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigate}
        onAskAI={handleAskAIWithQuery}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
