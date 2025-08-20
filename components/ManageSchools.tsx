
import React, { useState } from 'react';
import { School, Student } from '../types';
import ManageStudents from './ManageStudents';
import Card from './common/Card';
import Button from './common/Button';

interface ManageSchoolsProps {
  schools: School[];
  students: Student[];
  onAddSchool: (school: Omit<School, 'id' | 'user_id'>) => Promise<void>;
  onDeleteSchool: (schoolId: string) => Promise<void>;
  onUpdateSchool: (schoolId: string, data: { name: string }) => Promise<void>;
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onUpdateStudent: (studentId: string, data: { name: string; turma: string }) => Promise<void>;
}

const EditSchoolModal: React.FC<{
    school: School;
    onSave: (name: string) => Promise<void>;
    onCancel: () => void;
}> = ({ school, onSave, onCancel }) => {
    const [name, setName] = useState(school.name);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setLoading(true);
            try {
                await onSave(name.trim());
            } catch (error) {
                 console.error("Failed to update school", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card title="Editar Escola" className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-school-name" className="block text-sm font-medium text-neutral-700">Nome da Escola</label>
                        <input type="text" id="edit-school-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" required />
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


const ManageSchools: React.FC<ManageSchoolsProps> = (props) => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSchoolName.trim()) {
      setIsAdding(true);
      try {
        await props.onAddSchool({ name: newSchoolName.trim() });
        setNewSchoolName('');
      } catch (error) {
        console.error("Failed to add school", error);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleDeleteSchool = (schoolId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta escola? Todos os alunos associados também serão removidos.')) {
        props.onDeleteSchool(schoolId).catch(err => console.error("Failed to delete school", err));
    }
  }

  const handleUpdateSchool = async (name: string) => {
    if (editingSchool) {
      await props.onUpdateSchool(editingSchool.id, { name });
      setEditingSchool(null);
    }
  };

  if (selectedSchool) {
    const studentsOfSchool = props.students.filter(s => s.schoolId === selectedSchool.id);
    return (
      <ManageStudents
        school={selectedSchool}
        students={studentsOfSchool}
        onAddStudent={props.onAddStudent}
        onDeleteStudent={props.onDeleteStudent}
        onUpdateStudent={props.onUpdateStudent}
        onBack={() => setSelectedSchool(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-neutral-800">Gerenciar Escolas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card>
            <h2 className="text-2xl font-bold mb-4 text-neutral-800">Adicionar Escola</h2>
            <form onSubmit={handleAddSchool} className="space-y-4">
                <div>
                    <label htmlFor="school-name" className="block text-sm font-medium text-neutral-700">Nome da Escola</label>
                    <input
                        id="school-name"
                        type="text"
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Ex: Colégio Saber"
                    />
                </div>
                <Button type="submit" loading={isAdding} disabled={!newSchoolName.trim()} className="w-full">
                    Adicionar Escola
                </Button>
            </form>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-800">Escolas Cadastradas</h2>
        {props.schools.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">Nenhuma escola cadastrada ainda.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {props.schools.map(school => (
                    <Card key={school.id} className="flex flex-col">
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-neutral-800">{school.name}</h3>
                            <p className="text-sm text-neutral-500 mt-1">
                                {props.students.filter(s => s.schoolId === school.id).length} aluno(s)
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-neutral-200 flex space-x-2">
                           <Button onClick={() => setSelectedSchool(school)} className="w-full">
                                Gerenciar Alunos
                           </Button>
                           <Button
                                onClick={() => setEditingSchool(school)}
                                variant="secondary"
                                className="!px-3 !py-2"
                                aria-label={`Editar escola ${school.name}`}
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                           </Button>
                           <Button 
                             onClick={() => handleDeleteSchool(school.id)} 
                             variant="secondary" 
                             className="!px-3 !py-2 bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-400"
                             aria-label={`Remover escola ${school.name}`}
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </Button>
                        </div>
                    </Card>
                ))}
            </div>
        )}
      </div>
      {editingSchool && (
        <EditSchoolModal 
            school={editingSchool}
            onSave={handleUpdateSchool}
            onCancel={() => setEditingSchool(null)}
        />
      )}
    </div>
  );
};

export default ManageSchools;