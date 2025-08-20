
import React, { useState, useEffect, useCallback } from 'react';
import { Student, School, RecognitionEvent } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationContainer } from './components/NotificationToast';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import ManageSchools from './components/ManageSchools';
import Settings from './components/Settings';
import LiveRecognition from './components/LiveRecognition';
import Reports from './components/Reports';
import LoginPage from './components/LoginPage';
import { detectorConfigs } from './services/humanService';
import ManageAllStudents from './components/ManageAllStudents';
// Supabase removido - usando dados locais
import Spinner from './components/common/Spinner';

type View = 'dashboard' | 'live' | 'schools' | 'students' | 'reports' | 'settings';
export type DetectorConfigName = keyof typeof detectorConfigs;

const MainApp: React.FC = () => {
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();
    const [view, setView] = useState<View>('dashboard');
    const [configName, setConfigName] = useState<DetectorConfigName>('default');
    const [loading, setLoading] = useState(true);

    const [students, setStudents] = useState<Student[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [recognitionHistory, setRecognitionHistory] = useState<RecognitionEvent[]>([]);

    const fetchData = useCallback(async () => {
        // Dados mock locais - sem Supabase
        setLoading(true);
        try {
            // Dados mock para escolas
            const mockSchools: School[] = [
                { id: '1', name: 'Escola Municipal João Silva', address: 'Rua das Flores, 123', created_at: new Date().toISOString() },
                { id: '2', name: 'Colégio Estadual Maria Santos', address: 'Av. Principal, 456', created_at: new Date().toISOString() }
            ];
            setSchools(mockSchools);
            
            // Dados mock para estudantes
            const mockStudents: Student[] = [
                { id: '1', name: 'Ana Silva', school_id: '1', face_encoding: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: '2', name: 'João Santos', school_id: '1', face_encoding: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                { id: '3', name: 'Maria Oliveira', school_id: '2', face_encoding: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ];
            setStudents(mockStudents);
            
            // Dados mock para histórico de reconhecimento
            const mockHistory: RecognitionEvent[] = [];
            setRecognitionHistory(mockHistory);
            
        } catch (error) {
            console.error("Failed to load mock data", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const addSchool = useCallback(async (school: Omit<School, 'id'>) => {
        const newSchool: School = {
            ...school,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
        };
        setSchools(prev => [...prev, newSchool]);
    }, []);
    
    const updateSchool = useCallback(async (schoolId: string, schoolData: { name: string; address?: string }) => {
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, ...schoolData } : s));
    }, []);

    const deleteSchool = useCallback(async (schoolId: string) => {
        setSchools(prev => prev.filter(s => s.id !== schoolId));
        setStudents(prev => prev.filter(s => s.school_id !== schoolId));
    }, []);
    
    const addStudent = useCallback(async (student: Omit<Student, 'id'>) => {
        const newStudent: Student = {
            ...student,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        setStudents(prev => [...prev, newStudent]);
    }, []);

    const updateStudent = useCallback(async (studentId: string, studentData: { name?: string; school_id?: string; face_encoding?: string }) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...studentData, updated_at: new Date().toISOString() } : s));
    }, []);

    const deleteStudent = useCallback(async (studentId: string) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
    }, []);
    
    const handleRecognition = useCallback(async (student: Student) => {
        const lastRecognitionForStudent = recognitionHistory
            .filter(e => e.student_id === student.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (lastRecognitionForStudent && (Date.now() - new Date(lastRecognitionForStudent.timestamp).getTime() < 30000)) {
            return;
        }

        const newEvent: RecognitionEvent = {
            id: Date.now().toString(),
            student_id: student.id,
            school_id: student.school_id,
            timestamp: new Date().toISOString(),
            confidence: 0.95
        };
        
        setRecognitionHistory(prev => [newEvent, ...prev].slice(0, 500));

    }, [recognitionHistory]);


    const renderView = () => {
        if (loading) {
            return <div className="flex-1 flex items-center justify-center"><Spinner className="h-12 w-12" /></div>;
        }
        switch(view) {
            case 'dashboard':
                return <Dashboard students={students} schools={schools} configName={configName} onRecognize={handleRecognition} />;
            case 'live':
                return <LiveRecognition 
                    students={students} 
                    schools={schools} 
                    configName={configName} 
                    onRecognize={handleRecognition}
                    onExitFullscreen={() => setView('dashboard')}
                />;
            case 'schools':
                return <ManageSchools 
                            schools={schools} 
                            students={students}
                            onAddSchool={addSchool}
                            onDeleteSchool={deleteSchool}
                            onUpdateSchool={updateSchool}
                            onAddStudent={addStudent}
                            onDeleteStudent={deleteStudent}
                            onUpdateStudent={updateStudent}
                        />;
            case 'students':
                return <ManageAllStudents
                            students={students}
                            schools={schools}
                            onUpdateStudent={updateStudent}
                            onDeleteStudent={deleteStudent}
                        />
            case 'reports':
                return <Reports recognitionHistory={recognitionHistory} students={students} schools={schools} />;
            case 'settings':
                return <Settings currentConfig={configName} onSetConfig={setConfigName} />;
            default:
                return <Dashboard students={students} schools={schools} configName={configName} onRecognize={handleRecognition} />;
        }
    }

    // Supabase removido - aplicação funciona sem banco de dados

    // Login desativado - indo direto para o dashboard
    // if (authLoading) {
    //     return (
    //         <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
    //             <Spinner />
    //         </div>
    //     );
    // }

    // if (!isAuthenticated) {
    //     return <LoginPage />;
    // }

    return (
        <div className="flex min-h-screen bg-neutral-100 dark:bg-gray-900 text-neutral-800 dark:text-gray-200 transition-colors duration-200">
            <Sidebar 
                currentView={view} 
                onSetView={setView}
                userRole="admin"
            />
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {renderView()}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <MainApp />
                    <NotificationContainer />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
