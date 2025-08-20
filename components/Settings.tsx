
import React, { useState } from 'react';
import { BackupService } from '../services/backupService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Button from './common/Button';
import Card from './common/Card';

const Settings: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(
        localStorage.getItem('auto_backup_enabled') === 'true'
    );
    const { addNotification } = useNotifications();
    const { user } = useAuth();

    // Verificar se o usuário é admin
    const isAdmin = user?.role === 'admin';

    const handleExportData = async (format: 'json' | 'csv', dataType?: 'schools' | 'students' | 'events') => {
        if (!isAdmin) {
            addNotification({
                type: 'error',
                title: 'Acesso Negado',
                message: 'Apenas administradores podem exportar dados'
            });
            return;
        }

        setIsExporting(true);
        try {
            const backupData = await BackupService.exportAllData();
            
            if (format === 'json') {
                BackupService.downloadAsJSON(backupData);
                addNotification({
                    type: 'success',
                    title: 'Exportação Concluída',
                    message: 'Dados exportados com sucesso em formato JSON'
                });
            } else if (format === 'csv' && dataType) {
                BackupService.downloadAsCSV(backupData, dataType);
                addNotification({
                    type: 'success',
                    title: 'Exportação Concluída',
                    message: `Dados de ${dataType === 'schools' ? 'escolas' : dataType === 'students' ? 'alunos' : 'reconhecimentos'} exportados em CSV`
                });
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Erro na Exportação',
                message: 'Não foi possível exportar os dados. Tente novamente.'
            });
            console.error('Erro na exportação:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) {
            addNotification({
                type: 'error',
                title: 'Acesso Negado',
                message: 'Apenas administradores podem importar dados'
            });
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            await BackupService.importBackupData(backupData);
            
            addNotification({
                type: 'success',
                title: 'Importação Concluída',
                message: 'Dados importados com sucesso'
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Erro na Importação',
                message: 'Arquivo inválido ou erro durante a importação'
            });
            console.error('Erro na importação:', error);
        } finally {
            setIsImporting(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const toggleAutoBackup = () => {
        if (!isAdmin) {
            addNotification({
                type: 'error',
                title: 'Acesso Negado',
                message: 'Apenas administradores podem configurar backup automático'
            });
            return;
        }

        const newState = !autoBackupEnabled;
        setAutoBackupEnabled(newState);
        localStorage.setItem('auto_backup_enabled', newState.toString());
        
        if (newState) {
            BackupService.scheduleAutoBackup(24); // Backup a cada 24 horas
            addNotification({
                type: 'success',
                title: 'Backup Automático Ativado',
                message: 'Backup será realizado automaticamente a cada 24 horas'
            });
        } else {
            addNotification({
                type: 'info',
                title: 'Backup Automático Desativado',
                message: 'Backup automático foi desabilitado'
            });
        }
    };

    const getAutoBackupInfo = () => {
        const backup = BackupService.getAutoBackup();
        if (backup) {
            return new Date(backup.timestamp).toLocaleString('pt-BR');
        }
        return 'Nenhum backup automático encontrado';
    };

    if (!isAdmin) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-gray-100 mb-6">Configurações</h1>
                <Card>
                    <div className="text-center py-8">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Acesso Restrito</h3>
                        <p className="text-gray-600 dark:text-gray-400">Apenas administradores podem acessar as configurações do sistema.</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-gray-100 mb-6">Configurações do Sistema</h1>
            
            {/* Backup e Exportação */}
            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Backup e Exportação de Dados</h2>
                    
                    {/* Exportação Completa */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Exportação Completa</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => handleExportData('json')}
                                disabled={isExporting}
                                variant="primary"
                            >
                                {isExporting ? 'Exportando...' : 'Exportar JSON'}
                            </Button>
                        </div>
                    </div>

                    {/* Exportação por Tipo */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Exportação por Tipo (CSV)</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => handleExportData('csv', 'schools')}
                                disabled={isExporting}
                                variant="outline"
                            >
                                Exportar Escolas
                            </Button>
                            <Button
                                onClick={() => handleExportData('csv', 'students')}
                                disabled={isExporting}
                                variant="outline"
                            >
                                Exportar Alunos
                            </Button>
                            <Button
                                onClick={() => handleExportData('csv', 'events')}
                                disabled={isExporting}
                                variant="outline"
                            >
                                Exportar Reconhecimentos
                            </Button>
                        </div>
                    </div>

                    {/* Importação */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Importação de Dados</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportData}
                                disabled={isImporting}
                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                            />
                            {isImporting && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">Importando...</div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Selecione um arquivo JSON de backup para importar dados.
                        </p>
                    </div>

                    {/* Backup Automático */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Backup Automático</h3>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Realizar backup automático a cada 24 horas</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">Último backup: {getAutoBackupInfo()}</p>
                            </div>
                            <button
                                onClick={toggleAutoBackup}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                    autoBackupEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Informações do Sistema */}
            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Informações do Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão</h3>
                            <p className="text-lg text-gray-900 dark:text-gray-100">1.0.0</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Atualização</h3>
                            <p className="text-lg text-gray-900 dark:text-gray-100">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuário Atual</h3>
                            <p className="text-lg text-gray-900 dark:text-gray-100">{user?.name} ({user?.role})</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status do Sistema</h3>
                            <p className="text-lg text-green-600 dark:text-green-400">Operacional</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Settings;
