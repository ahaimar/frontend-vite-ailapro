import {type ReactNode, useEffect, Suspense} from 'react';
import {useAuthStore} from './context/authStore';
import './App.css';

import {Navigate, Routes, Route, useLocation} from "react-router";
import {AnimatePresence, motion} from "framer-motion";

import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen.tsx';

import AuthPage from './pages/AuthPage';
import DashboardPage from "./pages/DashboardPage";
import HomePage from './guid/HomePage';
import {Error400} from "./guid/Error400";

import AboutUs from './guid/AboutUs';
import AiChat from './pages/AiChat';
import MainTasksAdd from './testEditor/MainTasksAdd';
import {StartTest} from "./testEditor/exament/StartTest.tsx";
import WriteTestMenu from "./testEditor/exament/ExamGenerator/exam/WriteTestMenu.tsx";
import ReadTestMenu from "./testEditor/exament/ExamGenerator/exam/ReadTestMenu.tsx";
import ListenTestMenu from "./testEditor/exament/ExamGenerator/exam/ListenTestMenu.tsx";
import SpeakTestMenu from "./testEditor/exament/ExamGenerator/exam/SpeakTestMenu.tsx";
import {ExamShell} from "./testEditor/exament/ExamGenerator/exam/ExamShell.tsx";
import Profile from './pages/Profile.tsx';
import Menu from './testEditor/menu/Menu.tsx';
import MudelsExam from './testEditor/exament/ExamGenerator/mud/MudlesExam.tsx';
import ReadMudExam from './testEditor/exament/ExamGenerator/mud/ReadMudExam.tsx';
import ListenMudExam from './testEditor/exament/ExamGenerator/mud/ListenMudExam.tsx';
import SpeakingMudExam from './testEditor/exament/ExamGenerator/mud/SpeakingMudExam.tsx';
import ProgressMenu from './pages/progress/ProgressMenu.tsx';
import Menu_2 from './testEditor/menu/Menu_2.tsx';
import Mudels from './testEditor/menu/mudels.tsx';
import AdminUsersPage from './pages/adminPanal/AdminUsersPage.tsx';
import Payment from './components/bank/Payment.tsx';

function PageWrapper({children}: { children: ReactNode }) {
    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.2}}
        >
            {children}
        </motion.div>
    );
}

function RequireAuth({children}: { children: ReactNode }) {
    const {user, ready} = useAuthStore();

    if (!ready) return <LoadingScreen/>;
    if (!user) return <Navigate to="/login" replace/>;

    return children;
}

function RequireAdmin({children}: { children: ReactNode }) {
    const {user, ready} = useAuthStore();

    if (!ready) return <LoadingScreen/>;
    if (!user) return <Navigate to="/login" replace/>;
    if (user.role !== 'admin') return <Navigate to="/signup" replace/>;

    return children;
}
//<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
function RequireGuest({children}: { children: ReactNode }) {
    const {user, ready} = useAuthStore();

    if (!ready) return <LoadingScreen/>;
    if (user) return <Navigate to="/login" replace/>;

    return children;
}

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>

                <Route index path="/home" element={<HomePage/>}/>
                <Route path='/chat' element={<AiChat/>}/>
                {/* Public */}
                <Route path="/login" element={<RequireGuest><AuthPage tab="login"/></RequireGuest>}/>
                <Route path="/signup" element={<RequireGuest><AuthPage tab="signup"/></RequireGuest>}/>

                <Route path="/" element={<RequireAuth><AppLayout/></RequireAuth>}>

                    <Route index element={<Navigate to="home" replace/>}/>
                    <Route path="dashboard" element={<PageWrapper><DashboardPage/></PageWrapper>}/>
                    <Route path="profile" element={<PageWrapper><Profile /></PageWrapper>}/>
                    <Route path="progress" element={<PageWrapper><ProgressMenu /></PageWrapper>}/>

                    {/** menu mudel */}
                    <Route path={'/menu/:module'} element={<PageWrapper><Menu /></PageWrapper>}/>
                    <Route path={'/choose'} element={<PageWrapper><Menu_2 /></PageWrapper>}/>
                    <Route path={'/mude-menu'} element={<PageWrapper><Mudels /></PageWrapper>}/>

                    {/** */}
                    <Route path='/tasks/:id' element={<PageWrapper><StartTest/></PageWrapper>}/>

                    {/* Payment Pages 
                    <Route path='/payment' element={<PageWrapper><PaymentCheckout /></PageWrapper>}/>*/}
                    <Route path='/payment' element={<PageWrapper><Payment /></PageWrapper>}/>

                    /**mudels exam */
                    <Route path='mud/exam/writing/:id' element={<PageWrapper><MudelsExam/></PageWrapper>}/>
                    <Route path='mud/exam/reading/:id' element={<PageWrapper><ReadMudExam/></PageWrapper>}/>
                    <Route path='mud/exam/listening/:id' element={<PageWrapper><ListenMudExam/></PageWrapper>}/>
                    <Route path='mud/exam/speaking/:id' element={<PageWrapper><SpeakingMudExam/></PageWrapper>}/>

                    {/** Tests Exam */}
                    <Route path="/exam/write/:id" element={
                        <ExamShell  skillKey={'writeTest'}>
                            <WriteTestMenu />
                        </ExamShell>
                    } />
                    <Route path="/exam/read/:id"    element={
                        <ExamShell skillKey={'readTest'}>
                            <ReadTestMenu/>
                        </ExamShell>
                    }/>
                    <Route path="/exam/listen/:id"  element={
                        <ExamShell skillKey={'listenTest'}>
                            <ListenTestMenu/>
                        </ExamShell>
                    }/>
                    <Route path="/exam/speak/:id"   element={
                        <ExamShell skillKey={'speakTest'}>
                            <SpeakTestMenu/>
                        </ExamShell>
                    }/>

                    {/* Admin 
                    <Route path="admin" element={<RequireAdmin><AdminPage/></RequireAdmin>}/>
                    <Route path="users" element={<RequireAdmin><UsersPage/></RequireAdmin>}/>
                    <Route path="audit" element={<RequireAdmin><AuditPage/></RequireAdmin>}/>*/}
                    <Route path="create-test" element={<RequireAdmin><MainTasksAdd/></RequireAdmin>}/>
                    <Route path="users-manager" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>}/>

                </Route>

                {/* about us */}
                <Route path="/about" element={<AboutUs/>}/>
                {/* URL not found*/}
                <Route path="*" element={<Error400/>}/>

            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const checkSession = useAuthStore(s => s.checkSession);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return (
        <div className="min-h-screen bg-base-100">
            <Suspense fallback={<LoadingScreen/>}>
                <AppRoutes/>
            </Suspense>
        </div>
    );
}

export default App;