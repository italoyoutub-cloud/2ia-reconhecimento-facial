import React, { useState, useMemo } from 'react';
import { Student, School } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import EditStudentModal from './EditStudentModal';

interface ManageAllStudentsProps {
  students: Student[];
  schools: School[];
  onUpdateStudent: (studentId: string, data: { name: string; turma: string }) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
}

const ManageAllStudents: React.FC<ManageAllStudentsProps> = ({ students, schools, onUpdateStudent, onDeleteStudent }) => {
    const [filterSchoolId, setFilterSchoolId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s.name])), [schools]);

    const filteredStudents = useMemo(() => {
        return students
            .filter(student => !filterSchoolId || student.schoolId === filterSchoolId)
            .filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [students, filterSchoolId, searchQuery]);

    const handleUpdateStudent = async (name: string, turma: string) => {
        if (editingStudent) {
            await onUpdateStudent(editingStudent.id, { name, turma });
            setEditingStudent(null);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-neutral-800">Gerenciar Todos os Alunos</h1>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="search-student" className="block text-sm font-medium text-neutral-700">Buscar por nome</label>
                        <input
                            id="search-student"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Digite o nome do aluno..."
                        />
                    </div>
                    <div>
                        <label htmlFor="school-filter" className="block text-sm font-medium text-neutral-700">Filtrar por Escola</label>
                        <select
                            id="school-filter"
                            value={filterSchoolId}
                            onChange={(e) => setFilterSchoolId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Todas as Escolas</option>
                            {schools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Aluno</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Turma</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Escola</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                            {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={student.photo} alt={student.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-neutral-900">{student.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{student.turma}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{schoolMap.get(student.schoolId) || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-2">
                                            <button onClick={() => setEditingStudent(student)} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                            </button>
                                            <button onClick={() => onDeleteStudent(student.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-neutral-500">
                                        Nenhum aluno encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editingStudent && (
                <EditStudentModal 
                    student={editingStudent}
                    onSave={handleUpdateStudent}
                    onCancel={() => setEditingStudent(null)}
                />
            )}
        </div>
    );
};

export default ManageAllStudents;