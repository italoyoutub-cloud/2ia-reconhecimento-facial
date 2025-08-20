
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
import { supabase, isSupabaseConfigured } from './services/supabase';
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
        // Login desativado - carregando todos os dados sem filtro
        setLoading(true);
        try {
            // Carregar todos os dados sem filtro de usuário
            const { data: schoolsData, error: schoolsError } = await supabase
                .from('schools')
                .select('*')
                .order('name');
            if (schoolsError) throw schoolsError;
            setSchools(schoolsData || []);
            
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .order('name');
            if (studentsError) throw studentsError;
            setStudents(studentsData || []);
            
            const { data: historyData, error: historyError } = await supabase
                .from('recognition_events')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(500);
            if (historyError) throw historyError;
            setRecognitionHistory(historyData || []);
            
        } catch (error) {
            console.error("Failed to load data from Supabase", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (isSupabaseConfigured) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [fetchData, isSupabaseConfigured]);


    const addSchool = useCallback(async (school: Omit<School, 'id' | 'user_id'>) => {
        const { data, error } = await supabase.from('schools').insert(school).select();
        if (error) { console.error(error); throw error; }
        if (data) setSchools(prev => [...prev, data[0]]);
    }, []);
    
    const updateSchool = useCallback(async (schoolId: string, schoolData: { name: string }) => {
        const { data, error } = await supabase.from('schools').update(schoolData).eq('id', schoolId).select();
        if (error) { console.error(error); throw error; }
        if (data) setSchools(prev => prev.map(s => s.id === schoolId ? data[0] : s));
    }, []);

    const deleteSchool = useCallback(async (schoolId: string) => {
        // Supabase cascade delete will handle associated students
        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) { console.error(error); throw error; }
        setSchools(prev => prev.filter(s => s.id !== schoolId));
        setStudents(prev => prev.filter(s => s.schoolId !== schoolId)); // also update local state
    }, []);
    
    const addStudent = useCallback(async (student: Omit<Student, 'id'>) => {
        const { data, error } = await supabase.from('students').insert(student).select();
        if (error) { console.error(error); throw error; }
        if (data) setStudents(prev => [...prev, data[0]]);
    }, []);

    const updateStudent = useCallback(async (studentId: string, studentData: { name: string; turma: string }) => {
        const { data, error } = await supabase.from('students').update(studentData).eq('id', studentId).select();
        if (error) { console.error(error); throw error; }
        if (data) setStudents(prev => prev.map(s => s.id === studentId ? data[0] : s));
    }, []);

    const deleteStudent = useCallback(async (studentId: string) => {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) { console.error(error); throw error; }
        setStudents(prev => prev.filter(s => s.id !== studentId));
    }, []);
    
    const handleRecognition = useCallback(async (student: Student) => {
        const lastRecognitionForStudent = recognitionHistory
            .filter(e => e.studentId === student.id)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (lastRecognitionForStudent && (Date.now() - lastRecognitionForStudent.timestamp < 30000)) {
            return;
        }

        const newEvent = {
            studentId: student.id,
            schoolId: student.schoolId,
            timestamp: new Date().toISOString()
        };
        
        const { data, error } = await supabase.from('recognition_events').insert(newEvent).select();
        if (error) { console.error('Failed to log recognition:', error); return; }
        if (data) setRecognitionHistory(prev => [data[0], ...prev].slice(0, 500));

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

    if (!isSupabaseConfigured) {
        // The error message is already rendered by supabase.ts,
        // so we can just render a minimal component or null here to prevent
        // the rest of the app logic from running.
        return null;
    }

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
