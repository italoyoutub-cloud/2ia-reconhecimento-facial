
import React from 'react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onDeleteStudent: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onDeleteStudent, onEditStudent }) => {
  return (
    <div>
      {students.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">Nenhum aluno cadastrado ainda.</p>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {students.map((student) => (
            <div 
              key={student.id} 
              className="bg-neutral-50 p-2 rounded-lg flex items-center justify-between transition-all hover:shadow-md hover:bg-white"
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={student.photo} 
                  alt={student.name} 
                  className="w-12 h-12 object-cover rounded-full" 
                />
                <div>
                    <p className="font-semibold text-neutral-800 truncate">{student.name}</p>
                    <p className="text-sm text-neutral-500 truncate">{student.turma}</p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                    onClick={() => onEditStudent(student)}
                    className="text-neutral-400 hover:text-blue-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
                    aria-label={`Editar ${student.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                </button>
                <button
                    onClick={() => onDeleteStudent(student.id)}
                    className="text-neutral-400 hover:text-red-600 font-bold text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                    aria-label={`Remover ${student.name}`}
                >
                    &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentList;
