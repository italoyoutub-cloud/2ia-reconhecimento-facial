import React, { useState } from 'react';
import { Student, School } from '../types';
import AddStudent from './AddStudent';
import StudentList from './StudentList';
import Card from './common/Card';
import Button from './common/Button';
import EditStudentModal from './EditStudentModal';

interface ManageStudentsProps {
  school: School;
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onUpdateStudent: (studentId: string, data: { name: string; turma: string }) => Promise<void>;
  onBack: () => void;
}

const ManageStudents: React.FC<ManageStudentsProps> = ({ school, students, onAddStudent, onDeleteStudent, onUpdateStudent, onBack }) => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleUpdateStudent = async (name: string, turma: string) => {
      if (editingStudent) {
          await onUpdateStudent(editingStudent.id, { name, turma });
          setEditingStudent(null);
      }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Button variant="secondary" onClick={onBack} className="!px-3 !py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </Button>
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800">Gerenciar Alunos</h1>
                    <p className="text-neutral-500 -mt-1">Escola: <span className="font-semibold text-orange-600">{school.name}</span></p>
                </div>
            </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3">
            <Card title="Cadastrar Novo Aluno">
                <AddStudent onAddStudent={onAddStudent} schoolId={school.id} />
            </Card>
        </div>
        <div className="xl:col-span-2">
            <Card title="Alunos Cadastrados">
                <StudentList students={students} onDeleteStudent={onDeleteStudent} onEditStudent={setEditingStudent} />
            </Card>
        </div>
      </div>
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

export default ManageStudents;