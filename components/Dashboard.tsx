
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
    <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard de Reconhecimento</h1>
      <div className="dashboard-grid">
        <div className="video-section">
            <div className="card video-card">
                <video ref={videoRef} autoPlay muted playsInline className="video-element"></video>
                <canvas ref={canvasRef} className="canvas-overlay"></canvas>
                <div className="status-overlay">{status}</div>
                {status.startsWith('Carregando') && <div className="loading-overlay"><Spinner className="spinner" /> <p>{status}</p></div>}
            </div>
        </div>
        <div className="card status-card">
            <h2 className="status-title">Status</h2>
            <div className="status-content">
                <p className="status-label">Aluno Reconhecido:</p>
                {recognizedStudent ? (
                    <div className="student-info">
                        <img src={recognizedStudent.photo} alt={recognizedStudent.name} className="student-photo" />
                        <p className="student-name">{recognizedStudent.name}</p>
                        <p className="student-class">{recognizedStudent.turma}</p>
                        <p className="student-school">{getSchoolName(recognizedStudent.schoolId)}</p>
                    </div>
                ) : (
                    <div className="no-student">
                         <svg xmlns="http://www.w3.org/2000/svg" className="user-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="no-student-text">Ninguém</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;