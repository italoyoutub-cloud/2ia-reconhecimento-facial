import { supabase } from './supabase';
import { School, Student, RecognitionEvent } from '../types';

interface BackupData {
    schools: School[];
    students: Student[];
    recognitionEvents: RecognitionEvent[];
    exportDate: string;
    version: string;
}

interface ExportOptions {
    includeSchools?: boolean;
    includeStudents?: boolean;
    includeRecognitionEvents?: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
    schoolId?: string;
}

export class BackupService {
    private static readonly BACKUP_VERSION = '1.0.0';

    /**
     * Exporta todos os dados do sistema para backup
     */
    static async exportAllData(options: ExportOptions = {}): Promise<BackupData> {
        const {
            includeSchools = true,
            includeStudents = true,
            includeRecognitionEvents = true,
            dateRange,
            schoolId
        } = options;

        const backupData: BackupData = {
            schools: [],
            students: [],
            recognitionEvents: [],
            exportDate: new Date().toISOString(),
            version: this.BACKUP_VERSION
        };

        try {
            // Exportar escolas
            if (includeSchools) {
                let schoolsQuery = supabase.from('schools').select('*');
                
                if (schoolId) {
                    schoolsQuery = schoolsQuery.eq('id', schoolId);
                }
                
                const { data: schools, error: schoolsError } = await schoolsQuery;
                
                if (schoolsError) {
                    throw new Error(`Erro ao exportar escolas: ${schoolsError.message}`);
                }
                
                backupData.schools = schools || [];
            }

            // Exportar alunos
            if (includeStudents) {
                let studentsQuery = supabase.from('students').select('*');
                
                if (schoolId) {
                    studentsQuery = studentsQuery.eq('school_id', schoolId);
                }
                
                const { data: students, error: studentsError } = await studentsQuery;
                
                if (studentsError) {
                    throw new Error(`Erro ao exportar alunos: ${studentsError.message}`);
                }
                
                backupData.students = students || [];
            }

            // Exportar eventos de reconhecimento
            if (includeRecognitionEvents) {
                let eventsQuery = supabase
                    .from('recognition_events')
                    .select(`
                        *,
                        students!inner(
                            id,
                            name,
                            student_id,
                            school_id
                        )
                    `);
                
                if (schoolId) {
                    eventsQuery = eventsQuery.eq('school_id', schoolId);
                }
                
                if (dateRange) {
                    eventsQuery = eventsQuery
                        .gte('timestamp', dateRange.start)
                        .lte('timestamp', dateRange.end);
                }
                
                const { data: events, error: eventsError } = await eventsQuery;
                
                if (eventsError) {
                    throw new Error(`Erro ao exportar eventos: ${eventsError.message}`);
                }
                
                backupData.recognitionEvents = events || [];
            }

            return backupData;
        } catch (error) {
            console.error('Erro durante exportação:', error);
            throw error;
        }
    }

    /**
     * Baixa os dados como arquivo JSON
     */
    static downloadAsJSON(data: BackupData, filename?: string): void {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Baixa os dados como arquivo CSV
     */
    static downloadAsCSV(data: BackupData, dataType: 'schools' | 'students' | 'events', filename?: string): void {
        let csvContent = '';
        let defaultFilename = '';

        switch (dataType) {
            case 'schools':
                csvContent = this.convertSchoolsToCSV(data.schools);
                defaultFilename = `escolas_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'students':
                csvContent = this.convertStudentsToCSV(data.students);
                defaultFilename = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'events':
                csvContent = this.convertEventsToCSV(data.recognitionEvents);
                defaultFilename = `reconhecimentos_${new Date().toISOString().split('T')[0]}.csv`;
                break;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Converte dados de escolas para CSV
     */
    private static convertSchoolsToCSV(schools: School[]): string {
        if (schools.length === 0) return 'Nenhuma escola encontrada';
        
        const headers = ['ID', 'Nome', 'Endereço', 'Data de Criação'];
        const rows = schools.map(school => [
            school.id,
            school.name,
            school.address || '',
            new Date(school.created_at).toLocaleDateString('pt-BR')
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    /**
     * Converte dados de alunos para CSV
     */
    private static convertStudentsToCSV(students: Student[]): string {
        if (students.length === 0) return 'Nenhum aluno encontrado';
        
        const headers = ['ID', 'Nome', 'Matrícula', 'ID da Escola', 'Data de Criação'];
        const rows = students.map(student => [
            student.id,
            student.name,
            student.student_id || '',
            student.school_id,
            new Date(student.created_at).toLocaleDateString('pt-BR')
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    /**
     * Converte dados de eventos para CSV
     */
    private static convertEventsToCSV(events: RecognitionEvent[]): string {
        if (events.length === 0) return 'Nenhum evento encontrado';
        
        const headers = ['ID', 'Nome do Aluno', 'Matrícula', 'Confiança (%)', 'Data/Hora'];
        const rows = events.map(event => [
            event.id,
            event.student?.name || 'N/A',
            event.student?.student_id || 'N/A',
            (event.confidence * 100).toFixed(2),
            new Date(event.timestamp).toLocaleString('pt-BR')
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    /**
     * Importa dados de backup
     */
    static async importBackupData(backupData: BackupData): Promise<void> {
        try {
            // Validar estrutura do backup
            if (!this.validateBackupData(backupData)) {
                throw new Error('Estrutura de backup inválida');
            }

            // Importar escolas
            if (backupData.schools.length > 0) {
                const { error: schoolsError } = await supabase
                    .from('schools')
                    .upsert(backupData.schools, { onConflict: 'id' });
                
                if (schoolsError) {
                    throw new Error(`Erro ao importar escolas: ${schoolsError.message}`);
                }
            }

            // Importar alunos
            if (backupData.students.length > 0) {
                const { error: studentsError } = await supabase
                    .from('students')
                    .upsert(backupData.students, { onConflict: 'id' });
                
                if (studentsError) {
                    throw new Error(`Erro ao importar alunos: ${studentsError.message}`);
                }
            }

            // Importar eventos (apenas inserir, não atualizar)
            if (backupData.recognitionEvents.length > 0) {
                const { error: eventsError } = await supabase
                    .from('recognition_events')
                    .insert(backupData.recognitionEvents);
                
                if (eventsError) {
                    console.warn('Alguns eventos podem já existir:', eventsError.message);
                }
            }
        } catch (error) {
            console.error('Erro durante importação:', error);
            throw error;
        }
    }

    /**
     * Valida a estrutura dos dados de backup
     */
    private static validateBackupData(data: any): data is BackupData {
        return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.schools) &&
            Array.isArray(data.students) &&
            Array.isArray(data.recognitionEvents) &&
            typeof data.exportDate === 'string' &&
            typeof data.version === 'string'
        );
    }

    /**
     * Agenda backup automático
     */
    static scheduleAutoBackup(intervalHours: number = 24): void {
        const intervalMs = intervalHours * 60 * 60 * 1000;
        
        setInterval(async () => {
            try {
                const backupData = await this.exportAllData();
                
                // Salvar no localStorage como backup de emergência
                localStorage.setItem('auto_backup', JSON.stringify({
                    data: backupData,
                    timestamp: new Date().toISOString()
                }));
                
                console.log('Backup automático realizado com sucesso');
            } catch (error) {
                console.error('Erro no backup automático:', error);
            }
        }, intervalMs);
    }

    /**
     * Recupera backup automático do localStorage
     */
    static getAutoBackup(): { data: BackupData; timestamp: string } | null {
        try {
            const backup = localStorage.getItem('auto_backup');
            return backup ? JSON.parse(backup) : null;
        } catch (error) {
            console.error('Erro ao recuperar backup automático:', error);
            return null;
        }
    }
}

export default BackupService;