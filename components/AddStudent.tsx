
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getEmbeddingInstance } from '../services/humanService';
import type { Human, FaceResult, HumanResult, Student } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';

interface AddStudentProps {
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  schoolId: string;
}

type WorkflowStep = 'FORM' | 'CAPTURE' | 'CONFIRM';
type Feedback = {
    message: string;
    color: 'text-white' | 'text-green-400' | 'text-yellow-400';
};

const REQUIRED_GOOD_FRAMES = 30;
const FACE_BOX_IDEAL_WIDTH_PERCENT = 0.4;
const FACE_BOX_TOLERANCE_PERCENT = 0.15;
const YAW_THRESHOLD_DEG = 15;
const PITCH_THRESHOLD_DEG = 10;
const FACE_SCORE_THRESHOLD = 0.9;

const AddStudent: React.FC<AddStudentProps> = ({ onAddStudent, schoolId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const goodFramesCount = useRef(0);
  const lastGoodResult = useRef<HumanResult | null>(null);

  const [step, setStep] = useState<WorkflowStep>('FORM');
  const [feedback, setFeedback] = useState<Feedback>({ message: '', color: 'text-white' });
  const [name, setName] = useState('');
  const [turma, setTurma] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedData, setCapturedData] = useState<{ photo: string; embedding: number[] } | null>(null);

  const stopDetectionLoop = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const resetCapture = useCallback((clearForm = true) => {
    stopDetectionLoop();
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (clearForm) {
      setName('');
      setTurma('');
    }
    setError('');
    setCapturedData(null);
    goodFramesCount.current = 0;
    lastGoodResult.current = null;
    setFeedback({ message: '', color: 'text-white' });
    setStep('FORM');
  }, [stopDetectionLoop]);

  const captureAndProcess = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !lastGoodResult.current) return;
    
    setIsProcessing(true);
    setFeedback({ message: 'Capturando...', color: 'text-white' });

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const result = lastGoodResult.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    const photo = canvas.toDataURL('image/jpeg');

    if (result && result.face.length === 1 && result.face[0].embedding) {
      setCapturedData({ photo, embedding: result.face[0].embedding });
      setStep('CONFIRM');
    } else {
      setError('Falha ao processar a imagem. Tente novamente.');
      resetCapture(false);
    }
    setIsProcessing(false);
  }, [resetCapture]);

  const qualityCheckLoop = useCallback(async () => {
    if (step !== 'CAPTURE' || !humanRef.current || !videoRef.current || videoRef.current.paused) {
      return;
    }
    
    const human = humanRef.current;
    const video = videoRef.current;
    const result = await human.detect(video);

    let currentFeedback: Feedback = { message: 'Posicione o rosto na elipse', color: 'text-white' };
    let checksPassed = false;
    
    if (result.face.length === 0) {
        currentFeedback = { message: 'Nenhum rosto detectado', color: 'text-yellow-400' };
    } else if (result.face.length > 1) {
        currentFeedback = { message: 'Apenas uma pessoa, por favor', color: 'text-yellow-400' };
    } else {
        const face: FaceResult = result.face[0];
        const faceWidth = face.box[2];
        const videoWidth = video.videoWidth;
        const faceWidthPercent = faceWidth / videoWidth;
        const yaw = Math.abs(face.mesh[4][2] - face.mesh[238][2]);
        const pitch = Math.abs(face.mesh[131][1] - face.mesh[360][1]);
        const idealLowerBound = FACE_BOX_IDEAL_WIDTH_PERCENT - FACE_BOX_TOLERANCE_PERCENT;
        const idealUpperBound = FACE_BOX_IDEAL_WIDTH_PERCENT + FACE_BOX_TOLERANCE_PERCENT;

        if (face.faceScore < FACE_SCORE_THRESHOLD) {
            currentFeedback = { message: 'Buscando um bom ângulo...', color: 'text-yellow-400' };
        } else if (yaw > YAW_THRESHOLD_DEG) {
            currentFeedback = { message: 'Olhe para a frente', color: 'text-yellow-400' };
        } else if (pitch > PITCH_THRESHOLD_DEG) {
            currentFeedback = { message: 'Mantenha o rosto reto', color: 'text-yellow-400' };
        } else if (faceWidthPercent < idealLowerBound) {
            currentFeedback = { message: 'Aproxime-se', color: 'text-yellow-400' };
        } else if (faceWidthPercent > idealUpperBound) {
            currentFeedback = { message: 'Afaste-se um pouco', color: 'text-yellow-400' };
        } else {
            checksPassed = true;
            currentFeedback = { message: 'Ótimo, não se mova!', color: 'text-green-400' };
        }
    }

    setFeedback(currentFeedback);

    if (checksPassed) {
        goodFramesCount.current++;
        lastGoodResult.current = result;
        if (goodFramesCount.current >= REQUIRED_GOOD_FRAMES) {
            stopDetectionLoop();
            captureAndProcess();
            return;
        }
    } else {
        goodFramesCount.current = 0;
        lastGoodResult.current = null;
    }
    
    animationFrameId.current = requestAnimationFrame(qualityCheckLoop);
  }, [step, stopDetectionLoop, captureAndProcess]);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const initCameraAndLoop = async () => {
      setFeedback({ message: 'Carregando modelo de IA...', color: 'text-white' });
      try {
        humanRef.current = await getEmbeddingInstance();
        if (!isMounted) return;
        setFeedback({ message: 'Acessando câmera...', color: 'text-white' });
        
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.onplay = () => {
            if (isMounted) {
              setFeedback({ message: 'Posicione o rosto na elipse', color: 'text-white' });
              qualityCheckLoop();
            }
          };
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = (err as Error).message;
          setFeedback({ message: `Erro: ${errorMessage}`, color: 'text-yellow-400' });
          setError(`Não foi possível iniciar a câmera: ${errorMessage}`);
          setStep('FORM');
        }
      }
    };

    if (step === 'CAPTURE') {
      initCameraAndLoop();
    }
    
    return () => {
        isMounted = false;
        stopDetectionLoop();
        stream?.getTracks().forEach(track => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [step, qualityCheckLoop, stopDetectionLoop]);

  const handleStartCapture = () => {
    if (name.trim() && turma.trim()) {
      setError('');
      setStep('CAPTURE');
    }
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
        setError('Por favor, insira o nome do aluno.');
        return;
    }
    if (capturedData) {
        setIsSaving(true);
        setError('');
        try {
            await onAddStudent({ 
                name: name.trim(), 
                turma: turma.trim(), 
                schoolId: schoolId,
                ...capturedData 
            });
            resetCapture(true);
        } catch (err) {
            setError('Falha ao salvar aluno. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    }
  };

  const progress = step === 'CAPTURE' ? (goodFramesCount.current / REQUIRED_GOOD_FRAMES) * 100 : 0;
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center text-neutral-400 dark:text-gray-500">
          {step === 'FORM' && (
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="mt-2 text-sm">A câmera iniciará aqui</p>
            </div>
          )}
          {step === 'CAPTURE' && <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />}
          {step === 'CONFIRM' && capturedData && <img src={capturedData.photo} alt="Aluno capturado" className="w-full h-full object-cover" />}
          <canvas ref={canvasRef} className="hidden"></canvas>
          
          {step === 'CAPTURE' && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 75">
                  <defs><mask id="oval-mask"><rect width="100" height="75" fill="white" /><ellipse cx="50" cy="37.5" rx="25" ry="32" fill="black" /></mask></defs>
                  <rect width="100" height="75" fill="rgba(0,0,0,0.5)" mask="url(#oval-mask)" />
                  <ellipse cx="50" cy="37.5" rx="25" ry="32" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
                  <ellipse cx="50" cy="37.5" rx="25" ry="32" fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="205" strokeDashoffset={205 - (progress / 100) * 205} className="transition-all duration-100" transform="rotate(-90 50 37.5)" />
                </svg>
              </div>
              <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-center ${feedback.color} px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}>
                {isProcessing ? <Spinner className="h-4 w-4" /> : feedback.message}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col space-y-4">
        {step === 'FORM' && (
            <>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">Nome do Aluno</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="Ex: João da Silva" />
                </div>
                <div>
                    <label htmlFor="turma" className="block text-sm font-medium text-neutral-700 dark:text-gray-300">Turma</label>
                    <input type="text" id="turma" value={turma} onChange={(e) => setTurma(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" placeholder="Ex: 3º Ano B" />
                </div>
                 {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md w-full">{error}</p>}
                <div className="flex-grow flex items-end">
                  <Button onClick={handleStartCapture} disabled={!name.trim() || !turma.trim()} className="w-full">
                      Iniciar Captura
                  </Button>
                </div>
            </>
        )}
        {step === 'CAPTURE' && (
             <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
                <p className="text-neutral-500 dark:text-gray-400">Siga as instruções na tela para alinhar seu rosto.</p>
                <Button onClick={() => resetCapture(false)} variant="secondary" className="w-full">
                    Cancelar
                </Button>
            </div>
        )}
        {step === 'CONFIRM' && (
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4">
                <p className="text-lg font-semibold text-neutral-800 dark:text-gray-100">Usar esta foto para <span className="text-orange-600 dark:text-orange-400">{name}</span> da turma <span className="text-orange-600 dark:text-orange-400">{turma}</span>?</p>
                {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-md w-full">{error}</p>}
                <div className="w-full space-y-2">
                    <Button onClick={handleConfirm} loading={isSaving} disabled={isProcessing} className="w-full">
                        Sim, Salvar Aluno
                    </Button>
                    <Button onClick={() => resetCapture(false)} variant="secondary" disabled={isProcessing || isSaving} className="w-full">
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddStudent;