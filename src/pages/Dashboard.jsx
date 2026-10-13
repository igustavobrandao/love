import React, { useState, useEffect } from "react";
import { CoupleConfig, Auth, Photos } from "../entities/CoupleConfig";
import { UploadFile } from "../integrations/Core";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Heart, Upload, Music, Image, Trash2, Save, FileAudio, LogOut, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

// ISO (UTC) -> valor para <input type="datetime-local"> no fuso do navegador
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_CONFIG = {
  couple_name: '',
  relationship_start: '',
  background_music_url: '',
  photos: [],
  custom_phrase: '',
};

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await Auth.login(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-center">
        <Lock className="w-10 h-10 text-[#FF6B6B] mx-auto" />
        <h1 className="text-2xl font-bold text-white">Área restrita</h1>
        <Input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button
          type="submit"
          disabled={isSubmitting || !password}
          className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState('checking'); // checking | out | in
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    Auth.status().then((ok) => setAuthState(ok ? 'in' : 'out'));
  }, []);

  useEffect(() => {
    if (authState === 'in') loadConfig();
  }, [authState]);

  // Sessão expirada no meio da edição: volta para o login
  const handleApiError = (error, fallbackMessage) => {
    if (error.status === 401) {
      setAuthState('out');
      return;
    }
    alert(`${fallbackMessage}: ${error.message}`);
  };

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const loaded = await CoupleConfig.get();
      if (loaded) {
        setConfig({
          couple_name: loaded.couple_name || '',
          relationship_start: toLocalInput(loaded.relationship_start),
          background_music_url: loaded.background_music_url || '',
          photos: loaded.photos || [],
          custom_phrase: loaded.custom_phrase || '',
        });
      }
    } catch (error) {
      console.error("Dashboard: Falha ao carregar configuração:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await Auth.logout().catch(() => {});
    setAuthState('out');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await CoupleConfig.save({
        couple_name: config.couple_name,
        custom_phrase: config.custom_phrase,
        background_music_url: config.background_music_url,
        // datetime-local não tem fuso; new Date() interpreta no fuso do navegador
        relationship_start: config.relationship_start
          ? new Date(config.relationship_start).toISOString()
          : '',
      });
      alert('Configurações salvas com sucesso!');
      navigate(createPageUrl("Home"));
    } catch (error) {
      handleApiError(error, 'Falha ao salvar as configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    setIsUploading(true);
    const added = [];
    const failed = [];
    for (const file of files) {
      try {
        const uploaded = await UploadFile({ file, folder: 'photos' });
        const photo = await Photos.register({
          url: uploaded.file_url,
          pathname: uploaded.pathname,
          mime_type: uploaded.mime_type,
          size_bytes: uploaded.size_bytes,
        });
        added.push(photo);
      } catch (error) {
        if (error.status === 401) { setAuthState('out'); break; }
        failed.push(`${file.name} (${error.message})`);
      }
    }
    if (added.length) {
      setConfig(prev => ({ ...prev, photos: [...prev.photos, ...added] }));
    }
    if (failed.length) alert(`Não foi possível enviar:\n${failed.join('\n')}`);
    setIsUploading(false);
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file, folder: 'music' });
      setConfig(prev => ({ ...prev, background_music_url: file_url }));
    } catch (error) {
      handleApiError(error, 'Falha ao fazer upload da música');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async (photoId) => {
    if (!window.confirm('Remover esta foto definitivamente?')) return;
    try {
      await Photos.remove(photoId);
      setConfig(prev => ({ ...prev, photos: prev.photos.filter((p) => p.id !== photoId) }));
    } catch (error) {
      handleApiError(error, 'Falha ao remover a foto');
    }
  };

  const updatePhotoCaption = (photoId, caption) => {
    setConfig(prev => ({
      ...prev,
      photos: prev.photos.map((photo) =>
        photo.id === photoId ? { ...photo, caption } : photo
      )
    }));
  };

  const saveCaption = async (photoId, caption) => {
    try {
      await Photos.updateCaption(photoId, caption);
    } catch (error) {
      handleApiError(error, 'Falha ao salvar a legenda');
    }
  };

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Heart className="w-16 h-16 text-[#FF6B6B] animate-pulse" />
      </div>
    );
  }

  if (authState === 'out') {
    return <LoginForm onSuccess={() => setAuthState('in')} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
           <Heart className="w-16 h-16 text-[#FF6B6B] animate-pulse" />
           <p className="text-white mt-4">Carregando sua história...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className={`max-w-4xl mx-auto space-y-8 transition-opacity ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-[#FF6B6B]" fill="currentColor" />
            <h1 className="text-4xl font-bold text-white">Dashboard do Casal</h1>
            <Heart className="w-8 h-8 text-[#FF6B6B]" fill="currentColor" />
          </div>
          <p className="text-white/70 text-lg">Configure sua história de amor</p>
          <Button variant="ghost" onClick={handleLogout} className="text-white/60 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#FF6B6B]" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Nome do Casal</Label>
              <Input
                value={config.couple_name}
                onChange={(e) => setConfig(prev => ({ ...prev, couple_name: e.target.value }))}
                placeholder="Ex: João & Maria"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label className="text-white">Data e Hora do Início do Relacionamento</Label>
              <Input
                type="datetime-local"
                value={config.relationship_start}
                onChange={(e) => setConfig(prev => ({ ...prev, relationship_start: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Frase Especial</Label>
              <Textarea
                value={config.custom_phrase}
                onChange={(e) => setConfig(prev => ({ ...prev, custom_phrase: e.target.value }))}
                placeholder="Ex: Onde tudo começou..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-[#FF6B6B]" />
              Fotos do Casal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-[#FF6B6B]/50 rounded-lg p-6 text-center hover:border-[#FF6B6B] transition-colors">
                  <Upload className="w-8 h-8 text-[#FF6B6B] mx-auto mb-2" />
                  <p className="text-white">Clique para adicionar fotos</p>
                  <p className="text-white/50 text-sm">PNG, JPG, GIF, WEBP até 10MB</p>
                </div>
              </Label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
                multiple
              />
            </div>

            {config.photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.photos.map((photo, index) => (
                  <div key={photo.id} className="space-y-2">
                    <div className="relative">
                      <img 
                        src={photo.url} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Legenda da foto (opcional)"
                      value={photo.caption}
                      onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                      onBlur={(e) => saveCaption(photo.id, e.target.value)}
                      maxLength={300}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Music */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-[#FF6B6B]" />
              Música de Fundo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="music-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-[#FF6B6B]/50 rounded-lg p-6 text-center hover:border-[#FF6B6B] transition-colors">
                  <Music className="w-8 h-8 text-[#FF6B6B] mx-auto mb-2" />
                  <p className="text-white">
                    {isUploading ? 'Enviando...' : (config.background_music_url ? 'Alterar música' : 'Clique para adicionar música')}
                  </p>
                  <p className="text-white/50 text-sm">MP3, WAV, OGG, M4A até 50MB</p>
                </div>
              </Label>
              <input
                id="music-upload"
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            {config.background_music_url && (
              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                <FileAudio className="w-5 h-5 text-[#FF6B6B]" />
                <p className="text-white/80 text-sm truncate flex-1">Música carregada</p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-8 h-8"
                  onClick={() => setConfig(prev => ({...prev, background_music_url: ''}))}
                >
                  <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white px-8 py-3 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
