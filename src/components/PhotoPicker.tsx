import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

interface PhotoPickerProps {
  fotoAtual: string;
  aoAlterarFoto: (novaFotoDataUrl: string) => void;
  rotulo?: string;
}

const AVATAR_PADRAO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80';

function comprimirImagemElemento(img: HTMLImageElement | HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const TAMANHO = 240;
  canvas.width = TAMANHO;
  canvas.height = TAMANHO;
  const ctx = canvas.getContext('2d');
  if (!ctx) return AVATAR_PADRAO;

  const larguraOrig =
    img instanceof HTMLVideoElement ? img.videoWidth || 320 : img.naturalWidth || 240;
  const alturaOrig =
    img instanceof HTMLVideoElement ? img.videoHeight || 240 : img.naturalHeight || 240;

  const menorLado = Math.min(larguraOrig, alturaOrig);
  const sx = (larguraOrig - menorLado) / 2;
  const sy = (alturaOrig - menorLado) / 2;

  ctx.drawImage(img, sx, sy, menorLado, menorLado, 0, 0, TAMANHO, TAMANHO);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function PhotoPicker({
  fotoAtual,
  aoAlterarFoto,
  rotulo = 'Foto de Perfil'
}: PhotoPickerProps) {
  const [cameraAtiva, setCameraAtiva] = useState<boolean>(false);
  const [erroCamera, setErroCamera] = useState<string>('');
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function encerrarCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraAtiva(false);
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function iniciarCamera() {
    setErroCamera('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErroCamera('Seu navegador não suporta acesso direto à câmera.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraAtiva(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setErroCamera('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  function capturarDaCamera() {
    if (!videoRef.current) return;
    const base64 = comprimirImagemElemento(videoRef.current);
    aoAlterarFoto(base64);
    encerrarCamera();
  }

  function manipularUploadArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido (JPG, PNG, WEBP)!');
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const comprimida = comprimirImagemElemento(img);
        aoAlterarFoto(comprimida);
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
    evento.target.value = '';
  }

  return (
    <div className="form-group">
      <label>{rotulo}</label>

      <div className="photo-picker-box">
        <img
          src={fotoAtual || AVATAR_PADRAO}
          alt="Preview da foto"
          className="photo-picker-preview"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              ref={inputArquivoRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={manipularUploadArquivo}
            />

            <button
              type="button"
              className="btn-outline"
              onClick={() => inputArquivoRef.current?.click()}
            >
              <Upload size={15} />
              <span>Enviar Foto (Upload)</span>
            </button>

            {!cameraAtiva ? (
              <button
                type="button"
                className="btn-realtime"
                onClick={iniciarCamera}
              >
                <Camera size={15} />
                <span>Tirar Foto na Hora</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-realtime"
                onClick={encerrarCamera}
              >
                <X size={15} />
                <span>Fechar Câmera</span>
              </button>
            )}
          </div>

          <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            Faça upload de uma imagem do dispositivo ou capture instantaneamente pela câmera.
          </small>

          {erroCamera && (
            <small style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.8rem' }}>
              {erroCamera}
            </small>
          )}
        </div>
      </div>

      {cameraAtiva && (
        <div className="camera-preview-box">
          <video ref={videoRef} className="camera-video" playsInline muted />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn-realtime" onClick={encerrarCamera}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={capturarDaCamera}>
              <Check size={16} />
              <span>Capturar Foto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
