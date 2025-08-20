import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { RecognitionEvent } from '../types';

interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Auto-remove success notifications after 5 seconds
        if (notification.type === 'success') {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
            }, 5000);
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
        );
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Listen for real-time recognition events
    useEffect(() => {
        const channel = supabase
            .channel('recognition_events')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'recognition_events'
                },
                (payload) => {
                    const event = payload.new as RecognitionEvent;
                    
                    // Fetch student details for the notification
                    supabase
                        .from('students')
                        .select('name, student_id')
                        .eq('id', event.student_id)
                        .single()
                        .then(({ data: student }) => {
                            if (student) {
                                addNotification({
                                    type: 'info',
                                    title: 'Reconhecimento Detectado',
                                    message: `${student.name} (${student.student_id}) foi reconhecido com ${(event.confidence * 100).toFixed(1)}% de confiança`,
                                    data: event
                                });
                            }
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [addNotification]);

    // Listen for low confidence recognitions (potential alerts)
    useEffect(() => {
        const channel = supabase
            .channel('low_confidence_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'recognition_events',
                    filter: 'confidence=lt.0.7'
                },
                (payload) => {
                    const event = payload.new as RecognitionEvent;
                    
                    supabase
                        .from('students')
                        .select('name, student_id')
                        .eq('id', event.student_id)
                        .single()
                        .then(({ data: student }) => {
                            if (student) {
                                addNotification({
                                    type: 'warning',
                                    title: 'Reconhecimento com Baixa Confiança',
                                    message: `${student.name} foi reconhecido com apenas ${(event.confidence * 100).toFixed(1)}% de confiança. Verifique se é necessário atualizar a foto.`,
                                    data: event
                                });
                            }
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [addNotification]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            removeNotification,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;