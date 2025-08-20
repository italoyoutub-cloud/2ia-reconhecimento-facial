
import React, { useState, useMemo } from 'react';
import { RecognitionEvent, Student, School } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface ReportsProps {
  recognitionHistory: RecognitionEvent[];
  students: Student[];
  schools: School[];
}

const Reports: React.FC<ReportsProps> = ({ recognitionHistory, students, schools }) => {
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const schoolMap = useMemo(() => new Map(schools.map(s => [s.id, s])), [schools]);

  const filteredEvents = useMemo(() => {
    return recognitionHistory.filter(event => {
      const schoolMatch = !filterSchoolId || event.schoolId === filterSchoolId;
      const dateMatch = !filterDate || new Date(event.timestamp).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
      return schoolMatch && dateMatch;
    });
  }, [recognitionHistory, filterSchoolId, filterDate]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Aluno,Turma,Escola,Data,Hora\n";
    
    filteredEvents.forEach(event => {
      const student = studentMap.get(event.studentId);
      const school = schoolMap.get(event.schoolId);
      if (student && school) {
        const date = new Date(event.timestamp);
        const row = [
          `"${student.name}"`,
          `"${student.turma}"`,
          `"${school.name}"`,
          date.toLocaleDateString(),
          date.toLocaleTimeString()
        ].join(",");
        csvContent += row + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_reconhecimento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-gray-100">Relatórios de Reconhecimento</h1>
      
      <Card title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="school-filter" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">Filtrar por Escola</label>
            <select
              id="school-filter"
              value={filterSchoolId}
              onChange={e => setFilterSchoolId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Todas as Escolas</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">Filtrar por Data</label>
            <input
              type="date"
              id="date-filter"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
           <div className="flex gap-2">
            <Button onClick={() => { setFilterSchoolId(''); setFilterDate(''); }} variant="secondary" className="w-full">Limpar Filtros</Button>
            <Button onClick={handleExportCSV} className="w-full" disabled={filteredEvents.length === 0}>Exportar CSV</Button>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-gray-700">
            <thead className="bg-neutral-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">Aluno</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">Turma</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">Escola</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-gray-400 uppercase tracking-wider">Data e Hora</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-neutral-200 dark:divide-gray-700">
              {filteredEvents.length > 0 ? filteredEvents.map(event => {
                const student = studentMap.get(event.studentId);
                const school = schoolMap.get(event.schoolId);
                if (!student || !school) return null;
                return (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={student.photo} alt={student.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-gray-100">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-400">{student.turma}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-400">{school.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-gray-400">{new Date(event.timestamp).toLocaleString()}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-neutral-500 dark:text-gray-400">Nenhum registro encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;