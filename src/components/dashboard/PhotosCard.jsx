import React, { useState } from 'react';
import { Check, ImageOff, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { FILE_RULES, formatBytes } from '../../integrations/Core';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import FileDropzone from './FileDropzone';

const CAPTION_MAX = 300;
const TILE = 'relative h-44 w-full overflow-hidden rounded-lg bg-white/5';

/**
 * Foto com carregamento sob demanda: esqueleto pulsando até a imagem chegar, depois
 * aparece com fade. Fotos recém-enviadas usam a prévia local por baixo, então não piscam.
 */
function PhotoThumb({ src, preview, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${TILE} flex flex-col items-center justify-center gap-1 text-white/50`}>
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">Imagem indisponível</span>
      </div>
    );
  }
  return (
    <div className={TILE}>
      {!loaded && !preview && <div className="absolute inset-0 animate-dash-pulse bg-white/10" />}
      {preview && <img src={preview} alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

/** Cartão da foto que ainda está subindo: prévia local + barra de progresso animada. */
function UploadTile({ upload }) {
  const sending = upload.stage === 'Enviando';
  return (
    <div className="space-y-2 animate-dash-fade" aria-label={`Enviando ${upload.name}`}>
      <div className={TILE}>
        {upload.preview && <img src={upload.preview} alt="" aria-hidden="true" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover opacity-60" />}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
          <span className="text-sm font-semibold text-white drop-shadow">{sending ? `${upload.progress}%` : 'Salvando...'}</span>
          <div
            role="progressbar"
            aria-valuenow={upload.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className="relative h-full overflow-hidden rounded-full bg-[#FF6B6B] transition-[width] duration-300 ease-out"
              style={{ width: `${upload.progress}%` }}
            >
              <div className="absolute inset-0 animate-dash-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          </div>
        </div>
      </div>
      <p className="truncate text-xs text-white/50" title={upload.name}>{upload.name}</p>
    </div>
  );
}

const CaptionStatus = ({ status }) => {
  if (status === 'saving') return <span className="flex items-center gap-1 text-xs text-white/50"><Loader2 className="h-3 w-3 animate-spin" />Salvando...</span>;
  if (status === 'saved') return <span className="flex items-center gap-1 text-xs text-emerald-400"><Check className="h-3 w-3" />Salva</span>;
  if (status === 'error') return <span className="text-xs text-red-400">Não salvou. Clique fora do campo para tentar de novo.</span>;
  return null;
};

export default function PhotosCard({ photos, uploads, captionStatus, onFiles, onCaptionChange, onCaptionCommit, onRemove }) {
  const uploading = uploads.length > 0;
  const empty = photos.length === 0 && !uploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#FF6B6B]" />
          Fotos do casal
          {photos.length > 0 && <span className="text-sm font-normal text-white/50">({photos.length})</span>}
          {uploading && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#FF6B6B]/15 px-2.5 py-1 text-xs font-normal text-[#FF6B6B]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Enviando {uploads.length} {uploads.length === 1 ? 'foto' : 'fotos'}
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-white/50">Cada foto entra na lista assim que termina de enviar. Legendas salvam ao sair do campo.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <FileDropzone
          icon={Upload}
          title="Clique ou arraste fotos aqui"
          hint={`${FILE_RULES.photos.label} · até ${formatBytes(FILE_RULES.photos.maxBytes)} cada`}
          accept={FILE_RULES.photos.mimes.join(',')}
          multiple
          onFiles={onFiles}
        />

        {empty && (
          <p className="rounded-lg bg-white/5 p-6 text-center text-sm text-white/50">
            Nenhuma foto ainda. As fotos aparecem como stories na página principal.
          </p>
        )}

        {!empty && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {photos.map((photo, index) => (
              <div key={photo.id} className="space-y-2 animate-dash-fade">
                <div className="relative">
                  <PhotoThumb src={photo.url} preview={photo.preview} alt={photo.caption || `Foto ${index + 1}`} />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2 shadow-lg"
                    aria-label={`Remover foto ${index + 1}`}
                    onClick={() => onRemove(photo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{index + 1}</span>
                </div>
                <Textarea
                  aria-label={`Legenda da foto ${index + 1}`}
                  placeholder="Legenda (opcional)"
                  value={photo.caption}
                  maxLength={CAPTION_MAX}
                  onChange={(e) => onCaptionChange(photo.id, e.target.value)}
                  onBlur={(e) => onCaptionCommit(photo.id, e.target.value)}
                  className="min-h-[64px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <div className="flex h-4 items-center justify-between">
                  <CaptionStatus status={captionStatus[photo.id]} />
                  <span className="ml-auto text-xs text-white/40">{photo.caption.length}/{CAPTION_MAX}</span>
                </div>
              </div>
            ))}
            {uploads.map((u) => <UploadTile key={u.id} upload={u} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
