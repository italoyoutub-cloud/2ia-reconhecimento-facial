
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getDetectorInstance } from '../services/humanService';
import type { Human, Student, School, RecognitionEvent } from '../types';
import Spinner from './common/Spinner';
import type { DetectorConfigName } from '../App';
import { useNotifications } from '../contexts/NotificationContext';

interface LiveRecognitionProps {
  students: Student[];
  schools: School[];
  configName: DetectorConfigName;
  onRecognize: (student: Student) => void;
  onExitFullscreen?: () => void;
}

const LiveRecognition: React.FC<LiveRecognitionProps> = ({ students, schools, configName, onRecognize, onExitFullscreen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastRecognizedId = useRef<string | null>(null);
  const { addNotification } = useNotifications();

  const [status, setStatus] = useState('Inicializando...');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [recentEvents, setRecentEvents] = useState<(RecognitionEvent & { student: Student })[]>([]);

  const detectionStateRef = useRef({ students, onRecognize });
  useEffect(() => {
    detectionStateRef.current = { students, onRecognize };
  }, [students, onRecognize]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch(err) {
        setStatus(`Erro de câmera: ${(err as Error).message}`);
      }
    };
    getDevices();
  }, []);
  
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
      
    // Sincronizar dimensões do canvas com o vídeo exibido
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
          if (lastRecognizedId.current !== bestMatch.student.id) {
            lastRecognizedId.current = bestMatch.student.id;
            currentOnRecognize(bestMatch.student);
            
            // Add notification for recognition
            addNotification({
              type: bestMatch.similarity > 0.8 ? 'success' : 'warning',
              title: 'Reconhecimento Detectado',
              message: `${bestMatch.student.name} foi reconhecido com ${(bestMatch.similarity * 100).toFixed(1)}% de confiança`
            });
            
            const newEvent = {
              id: `${Date.now()}-${bestMatch.student.id}`,
              studentId: bestMatch.student.id,
              schoolId: bestMatch.student.schoolId,
              timestamp: Date.now(),
              student: bestMatch.student
            };
            
            setRecentEvents(prev => [newEvent, ...prev].slice(0, 10));
            setTimeout(() => {
              setRecentEvents(prev => prev.filter(e => e.id !== newEvent.id));
            }, 8000);
          }
        } else {
            lastRecognizedId.current = null;
        }
      }
    }
    
    animationFrameId.current = requestAnimationFrame(detectionLoop);
  }, []);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const init = async () => {
      if (!selectedDeviceId) return;

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      humanRef.current = null;
      if (isMounted) {
        setStatus(`Carregando predefinição: ${configName}...`);
      }
      
      try {
        const humanInstance = await getDetectorInstance(configName);
        if (!isMounted) return;
        
        humanRef.current = humanInstance;
        setStatus('Acessando câmera...');
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { deviceId: { exact: selectedDeviceId } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onplay = () => {
            if (isMounted) {
              setStatus('Detectando...');
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
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [configName, selectedDeviceId, detectionLoop]);


  return (
    <div className="fixed inset-0 bg-black text-white">
      <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover"></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover"></canvas>
      
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
        <select 
            onChange={e => setSelectedDeviceId(e.target.value)}
            value={selectedDeviceId || ''}
            className="bg-black/50 dark:bg-gray-800/80 border border-neutral-600 dark:border-gray-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-white dark:text-gray-200"
        >
            {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
            ))}
        </select>
        <div className="bg-black/50 dark:bg-gray-800/80 px-3 py-1.5 rounded-md text-sm text-white dark:text-gray-200">{status}</div>
        {onExitFullscreen && (
          <button
            onClick={onExitFullscreen}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
            title="Sair do modo tela cheia"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Sair
          </button>
        )}
      </div>

      {status.startsWith('Carregando') && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
          <Spinner className="mb-4" />
          <p>{status}</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-10 overflow-hidden">
        <div className="flex space-x-4 overflow-x-auto pb-2">
            {recentEvents.map(event => (
                <div key={event.id} className="animate-fade-in-up bg-black/70 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3 w-64 flex-shrink-0 shadow-lg border border-neutral-700 dark:border-gray-600">
                    <img src={event.student.photo} alt={event.student.name} className="w-12 h-12 rounded-full object-cover"/>
                    <div>
                        <p className="font-bold truncate">{event.student.name}</p>
                        <p className="text-sm text-neutral-300 dark:text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
       <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LiveRecognition;