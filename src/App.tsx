import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { GraduationCap } from 'lucide-react';
import { BrandLogo } from './components/common/BrandLogo';
import { InteractiveBackground3D } from './components/3d/InteractiveBackground3D';
import { CustomCursorFX } from './components/common/CustomCursorFX';

// Dynamic route-based code splitting for non-critical application modules
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/Auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SubjectLibraryPage = React.lazy(() => import('./pages/SubjectLibraryPage').then((m) => ({ default: m.SubjectLibraryPage })));
const SubjectDetailPage = React.lazy(() => import('./pages/SubjectDetailPage').then((m) => ({ default: m.SubjectDetailPage })));
const AITutorPage = React.lazy(() => import('./pages/AITutorPage').then((m) => ({ default: m.AITutorPage })));
const PDFAnalyzerPage = React.lazy(() => import('./pages/PDFAnalyzerPage').then((m) => ({ default: m.PDFAnalyzerPage })));
const QuizGeneratorPage = React.lazy(() => import('./pages/QuizGeneratorPage').then((m) => ({ default: m.QuizGeneratorPage })));
const StudyPlannerPage = React.lazy(() => import('./pages/StudyPlannerPage').then((m) => ({ default: m.StudyPlannerPage })));
const WeakTopicDetectionPage = React.lazy(() => import('./pages/WeakTopicDetectionPage').then((m) => ({ default: m.WeakTopicDetectionPage })));
const ProgressAnalyticsPage = React.lazy(() => import('./pages/ProgressAnalyticsPage').then((m) => ({ default: m.ProgressAnalyticsPage })));
const StudyMaterialsPage = React.lazy(() => import('./pages/StudyMaterialsPage').then((m) => ({ default: m.StudyMaterialsPage })));
const TeacherAdminPage = React.lazy(() => import('./pages/TeacherAdminPage').then((m) => ({ default: m.TeacherAdminPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const BookOpeningTransition = React.lazy(() => import('./components/3d/BookOpeningTransition').then((m) => ({ default: m.BookOpeningTransition })));
const FloatingAIAssistant3D = React.lazy(() => import('./components/3d/FloatingAIAssistant3D').then((m) => ({ default: m.FloatingAIAssistant3D })));

const ModuleFallback: React.FC = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8 animate-fadeIn">
    <div className="flex flex-col items-center gap-3">
      <BrandLogo size="lg" className="animate-pulse" />
      <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden mt-1">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }} />
      </div>
      <p className="text-xs text-slate-400 font-mono tracking-wide">Loading module...</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOpeningBook, setIsOpeningBook] = useState(false);

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
    if (user && !loading && sessionStorage.getItem('studysphere_play_book_transition') === '1') {
      sessionStorage.removeItem('studysphere_play_book_transition');
      setIsOpeningBook(true);
    }
  }, [user, loading]);

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

    // If logged-in user visits auth pages or bare /app, redirect to dashboard
    if (user && (currentPath === '/login' || currentPath === '/register' || currentPath === '/app')) {
      if (!isOpeningBook) {
        navigate('/app/dashboard');
      }
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
          <BrandLogo size="lg" className="animate-pulse" />
          <p className="text-xs text-slate-400 font-mono tracking-wide">Restoring session...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    setIsOpeningBook(true);
  };

  // 3D Magical Book Opening Transition after Sign In / Registration
  if (isOpeningBook) {
    return (
      <Suspense fallback={null}>
        <BookOpeningTransition
          onComplete={() => {
            setIsOpeningBook(false);
            navigate('/app/dashboard');
          }}
        />
      </Suspense>
    );
  }

  // 2. Standalone Auth Pages
  if (currentPath === '/login') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <LoginPage onNavigate={navigate} onSuccess={handleAuthSuccess} />
      </Suspense>
    );
  }

  if (currentPath === '/register') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <RegisterPage onNavigate={navigate} onSuccess={handleAuthSuccess} />
      </Suspense>
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <ForgotPasswordPage onNavigate={navigate} />
      </Suspense>
    );
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex transition-colors duration-250 relative">
      {/* Dynamic 3D Neural Constellation Ambient Background */}
      <InteractiveBackground3D intensity="subtle" />

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
          <Suspense fallback={<ModuleFallback />}>
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

            {/* Client-Side 404 Fallback for unknown /app/* routes */}
            {!(
              currentPath === '/app/dashboard' ||
              currentPath === '/app/subjects' ||
              currentPath.startsWith('/app/subjects/') ||
              currentPath === '/app/ai-tutor' ||
              currentPath === '/app/pdf-analyzer' ||
              currentPath === '/app/quiz' ||
              currentPath === '/app/planner' ||
              currentPath === '/app/weak-topics' ||
              currentPath === '/app/progress' ||
              currentPath === '/app/materials' ||
              currentPath === '/app/admin' ||
              currentPath === '/app/profile'
            ) && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Workspace Section Not Found</h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    The study section you navigated to does not exist or has been relocated.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Return to Study Dashboard
                </button>
              </div>
            )}
          </Suspense>
        </main>
      </div>

      {/* Interactive 3D Holographic AI Assistant Companion */}
      <Suspense fallback={null}>
        <FloatingAIAssistant3D onNavigate={navigate} />
      </Suspense>

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
        <CustomCursorFX />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
