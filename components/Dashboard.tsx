
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getDetectorInstance } from '../services/humanService';
import type { Human, Student, School } from '../types';
import Card from './common/Card';
import Spinner from './common/Spinner';
import type { DetectorConfigName } from '../App';
import { useNotifications } from '../contexts/NotificationContext';

interface DashboardProps {
  students: Student[];
  schools: School[];
  configName: DetectorConfigName;
  onRecognize: (student: Student) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, schools, configName, onRecognize }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionTimeoutRef = useRef<number | null>(null);

  const [status, setStatus] = useState('Inicializando...');
  const [recognizedStudent, setRecognizedStudent] = useState<Student | null>(null);
  const { addNotification } = useNotifications();

  const detectionStateRef = useRef({ students, recognizedStudent, onRecognize });
  useEffect(() => {
    detectionStateRef.current = { students, recognizedStudent, onRecognize };
  }, [students, recognizedStudent, onRecognize]);


  const detectionLoop = useCallback(async () => {
    if (!humanRef.current || !videoRef.current || !canvasRef.current || 
        videoRef.current.paused || videoRef.current.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(detectionLoop);
      return;
    }

    const humanInstance = humanRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Verificar se o vídeo está realmente reproduzindo
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameId.current = requestAnimationFrame(detectionLoop);
      return;
    }
      
    if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    const result = await humanInstance.detect(video);
    
    // Limpar canvas antes de desenhar para evitar sobreposição
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Desenhar o frame do vídeo no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    // Desenhar apenas as detecções sobre o vídeo
    await humanInstance.draw.all(canvas, result);

    if (result.face && result.face.length > 0) {
      const detectedFace = result.face[0];
      const { students: currentStudents, onRecognize: currentOnRecognize } = detectionStateRef.current;

      if (detectedFace.embedding && currentStudents.length > 0) {
        let bestMatch = { student: null as Student | null, similarity: 0 };
        for (const student of currentStudents) {
          const similarity = humanInstance.match.similarity(detectedFace.embedding, student.embedding);
          if (similarity > bestMatch.similarity) {
            bestMatch = { student, similarity };
          }
        }

        const RECOGNITION_THRESHOLD = 0.65;
        if (bestMatch.similarity > RECOGNITION_THRESHOLD && bestMatch.student) {
          if (detectionStateRef.current.recognizedStudent?.id !== bestMatch.student.id) {
            setRecognizedStudent(bestMatch.student);
            
            // Add notification for recognition
            addNotification({
              type: bestMatch.similarity > 0.8 ? 'success' : 'warning',
              title: 'Aluno Reconhecido',
              message: `${bestMatch.student.name} foi reconhecido com ${(bestMatch.similarity * 100).toFixed(1)}% de confiança`
            });
            
            currentOnRecognize(bestMatch.student);
          }
          if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = window.setTimeout(() => setRecognizedStudent(null), 5000);
        }
      }
    }
    
    animationFrameId.current = requestAnimationFrame(detectionLoop);
  }, []);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const init = async () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      humanRef.current = null;
      if (isMounted) {
        setStatus(`Carregando predefinição: ${configName}...`);
        setRecognizedStudent(null);
      }
      
      try {
        const humanInstance = await getDetectorInstance(configName);
        if (!isMounted) return;
        
        humanRef.current = humanInstance;
        setStatus('Acessando câmera...');
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onplay = () => {
            if (isMounted) {
              setStatus('Pronto para detecção.');
              detectionLoop();
            }
          };
        }
      } catch (err) {
        console.error("Initialization error:", err);
        if (isMounted) setStatus(`Erro: ${(err as Error).message}`);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [configName, detectionLoop]);

  const getSchoolName = (schoolId: string) => {
    return schools.find(s => s.id === schoolId)?.name || 'Escola não encontrada';
  };

  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-gray-100">Dashboard de Reconhecimento</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="relative overflow-hidden aspect-video p-0">
                <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover"></canvas>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md text-sm">{status}</div>
                {status.startsWith('Carregando') && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white"><Spinner className="mb-4" /> <p>{status}</p></div>}
            </Card>
        </div>
        <Card>
            <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-gray-100">Status</h2>
            <div className="bg-neutral-100 dark:bg-gray-800 p-4 rounded-lg text-center h-full flex flex-col justify-center">
                <p className="text-lg text-neutral-600 dark:text-gray-400 mb-2">Aluno Reconhecido:</p>
                {recognizedStudent ? (
                    <div className="flex flex-col items-center">
                        <img src={recognizedStudent.photo} alt={recognizedStudent.name} className="w-24 h-24 rounded-full object-cover mb-2 ring-4 ring-orange-500" />
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{recognizedStudent.name}</p>
                        <p className="text-lg font-medium text-neutral-600 dark:text-gray-400 -mt-1">{recognizedStudent.turma}</p>
                        <p className="text-sm font-medium text-neutral-500 dark:text-gray-500">{getSchoolName(recognizedStudent.schoolId)}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-neutral-400 dark:text-gray-600">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-2xl font-bold">Ninguém</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;