import React, { useState } from 'react';
import { Student } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface EditStudentModalProps {
    student: Student;
    onSave: (name: string, turma: string) => Promise<void>;
    onCancel: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onSave, onCancel }) => {
    const [name, setName] = useState(student.name);
    const [turma, setTurma] = useState(student.turma);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && turma.trim()) {
            setLoading(true);
            try {
                await onSave(name.trim(), turma.trim());
            } catch (error) {
                console.error("Failed to update student", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card title="Editar Aluno" className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-700">Nome do Aluno</label>
                        <input type="text" id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" required />
                    </div>
                    <div>
                        <label htmlFor="edit-turma" className="block text-sm font-medium text-neutral-700">Turma</label>
                        <input type="text" id="edit-turma" value={turma} onChange={(e) => setTurma(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
                        <Button type="submit" loading={loading}>Salvar Alterações</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditStudentModal;
