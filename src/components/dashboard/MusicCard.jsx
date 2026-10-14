import React from 'react';
import { FileAudio, Music, Trash2 } from 'lucide-react';
import { FILE_RULES, formatBytes } from '../../integrations/Core';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import FileDropzone from './FileDropzone';
import { nameFromUrl } from './errors';

export default function MusicCard({ url, pending, upload, onFiles, onRemove }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-[#FF6B6B]" />
          Música de fundo
        </CardTitle>
        <p className="text-sm text-white/50">Toca na página principal. A troca só vale depois de salvar.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {url && (
          <div className="space-y-3 rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <FileAudio className="h-5 w-5 shrink-0 text-[#FF6B6B]" />
              <p className="flex-1 truncate text-sm text-white" title={nameFromUrl(url)}>{nameFromUrl(url)}</p>
              {pending && (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">não salva</span>
              )}
              <Button size="icon" variant="ghost" aria-label="Remover música" onClick={onRemove}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
            <audio controls preload="metadata" src={url} className="w-full" />
          </div>
        )}

        <FileDropzone
          icon={Music}
          title={url ? 'Trocar música' : 'Clique ou arraste uma música aqui'}
          hint={`${FILE_RULES.music.label} · até ${formatBytes(FILE_RULES.music.maxBytes)}`}
          accept={FILE_RULES.music.mimes.join(',')}
          busy={!!upload}
          onFiles={onFiles}
        />

        {upload && (
          <div className="rounded-lg bg-white/5 p-3">
            <div className="mb-1.5 flex justify-between gap-3 text-sm">
              <span className="truncate text-white" title={upload.name}>{upload.name}</span>
              <span className="shrink-0 text-white/60">Enviando {upload.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={upload.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[#FF6B6B] transition-all" style={{ width: `${upload.progress}%` }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
