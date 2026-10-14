import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Auth, CoupleConfig, Photos } from "../entities/CoupleConfig";
import { UploadFile, validateFile } from "../integrations/Core";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/button";
import { ToastProvider, useToast } from "../components/dashboard/Toast";
import ConfirmDialog from "../components/dashboard/ConfirmDialog";
import MessageDialog from "../components/dashboard/MessageDialog";
import LoginForm from "../components/dashboard/LoginForm";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import BasicInfoCard from "../components/dashboard/BasicInfoCard";
import PhotosCard from "../components/dashboard/PhotosCard";
import MusicCard from "../components/dashboard/MusicCard";
import SaveBar from "../components/dashboard/SaveBar";
import useUnsavedGuard from "../components/dashboard/useUnsavedGuard";
import { friendlyError } from "../components/dashboard/errors";

// Campos que dependem do botão "Salvar" (fotos e legendas salvam na hora)
const FIELDS = ["couple_name", "relationship_start", "custom_phrase", "background_music_url"];
// Quantas fotos sobem ao mesmo tempo
const UPLOAD_CONCURRENCY = 3;
const EMPTY = { couple_name: "", relationship_start: "", custom_phrase: "", background_music_url: "" };

// ISO (UTC) -> valor para <input type="datetime-local"> no fuso do navegador
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function DashboardContent() {
  const navigate = useNavigate();
  const toast = useToast();

  const [authState, setAuthState] = useState("checking"); // checking | out | in
  const [loginNotice, setLoginNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [captionStatus, setCaptionStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [musicUpload, setMusicUpload] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'photo' | 'music' | 'discard', photo? }
  const [isRemoving, setIsRemoving] = useState(false);
  const [problems, setProblems] = useState(null); // { title, description, items }

  const hasLoaded = useRef(false);
  const savedCaptions = useRef(new Map());
  const uploadSeq = useRef(0);
  const registerChain = useRef(Promise.resolve());

  const dirty = useMemo(() => FIELDS.some((k) => draft[k] !== saved[k]), [draft, saved]);
  const guard = useUnsavedGuard(dirty);

  useEffect(() => {
    Auth.status().then((ok) => setAuthState(ok ? "in" : "out"));
  }, []);

  useEffect(() => {
    if (authState === "in" && !hasLoaded.current) loadConfig();
  }, [authState]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConfig = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const loaded = await CoupleConfig.get();
      const values = loaded
        ? {
            couple_name: loaded.couple_name || "",
            relationship_start: toLocalInput(loaded.relationship_start),
            custom_phrase: loaded.custom_phrase || "",
            background_music_url: loaded.background_music_url || "",
          }
        : EMPTY;
      const loadedPhotos = loaded?.photos || [];
      savedCaptions.current = new Map(loadedPhotos.map((p) => [p.id, p.caption]));
      setDraft(values);
      setSaved(values);
      setPhotos(loadedPhotos);
      hasLoaded.current = true;
    } catch (error) {
      console.error("Dashboard: falha ao carregar configuração:", error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Sessão caiu no meio da edição: volta ao login sem perder o que já foi digitado
  const sessionExpired = () => {
    setLoginNotice("Sua sessão expirou. Entre de novo; o que você digitou continua aqui.");
    setAuthState("out");
  };

  // Trata erro de API: 401 volta ao login, o resto vira aviso
  const handleError = (error, prefix) => {
    if (error?.status === 401) return sessionExpired();
    toast.error(`${prefix} ${friendlyError(error)}`);
  };

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const handleLogout = async () => {
    await Auth.logout().catch(() => {});
    setLoginNotice("");
    setAuthState("out");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await CoupleConfig.save({
        couple_name: draft.couple_name,
        custom_phrase: draft.custom_phrase,
        background_music_url: draft.background_music_url,
        // datetime-local não tem fuso; new Date() interpreta no fuso do navegador
        relationship_start: draft.relationship_start ? new Date(draft.relationship_start).toISOString() : "",
      });
      setSaved(draft);
      toast.success("Alterações salvas!", {
        action: { label: "Ver história", onClick: () => navigate(createPageUrl("Home")) },
      });
    } catch (error) {
      handleError(error, "Não foi possível salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // ----- Fotos -----

  const patchUpload = (id, patch) => setUploads((all) => all.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  // O registro no banco é serializado: os envios correm em paralelo, mas assim a
  // ordem das fotos e a criação da configuração inicial não disputam entre si.
  const registerSerial = (payload) => {
    const run = registerChain.current.then(() => Photos.register(payload));
    registerChain.current = run.catch(() => {});
    return run;
  };

  const handlePhotoFiles = async (files) => {
    const failures = [];
    const valid = [];
    files.forEach((file) => {
      const reason = validateFile(file, "photos");
      if (reason) failures.push({ name: file.name, reason });
      else valid.push(file);
    });

    const items = valid.map((file) => ({
      id: ++uploadSeq.current,
      file,
      name: file.name,
      preview: URL.createObjectURL(file), // prévia imediata, antes do envio terminar
      progress: 0,
      stage: "Enviando",
    }));
    setUploads((all) => [...all, ...items]);

    let added = 0;
    let expired = false;
    const usedPreviews = new Set();

    const processPhoto = async (item) => {
      try {
        const up = await UploadFile({ file: item.file, folder: "photos", onProgress: (p) => patchUpload(item.id, { progress: p }) });
        patchUpload(item.id, { progress: 100, stage: "Salvando" });
        const photo = await registerSerial({
          url: up.file_url,
          pathname: up.pathname,
          mime_type: up.mime_type,
          size_bytes: up.size_bytes,
        });
        savedCaptions.current.set(photo.id, photo.caption);
        usedPreviews.add(item.preview);
        // Anexa na grade assim que esta foto termina, sem esperar as outras
        setPhotos((all) => [...all, { ...photo, preview: item.preview }]);
        added += 1;
      } catch (error) {
        if (error?.status === 401) expired = true;
        else failures.push({ name: item.name, reason: friendlyError(error) });
      } finally {
        setUploads((all) => all.filter((u) => u.id !== item.id));
      }
    };

    const queue = [...items];
    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
      while (queue.length && !expired) await processPhoto(queue.shift());
    });
    await Promise.all(workers);

    // Limpeza: itens que não chegaram a ser processados e prévias não aproveitadas
    setUploads((all) => all.filter((u) => !items.some((i) => i.id === u.id)));
    items.forEach((i) => !usedPreviews.has(i.preview) && URL.revokeObjectURL(i.preview));

    if (expired) sessionExpired();
    if (added > 0) toast.success(added === 1 ? "Foto adicionada!" : `${added} fotos adicionadas!`);
    if (failures.length > 0) {
      setProblems({
        title: failures.length === 1 ? "Uma foto não foi enviada" : `${failures.length} fotos não foram enviadas`,
        description: added > 0 ? "As demais foram enviadas normalmente." : undefined,
        items: failures,
      });
    }
  };

  const handleCaptionChange = (id, caption) => {
    setPhotos((all) => all.map((p) => (p.id === id ? { ...p, caption } : p)));
    setCaptionStatus((s) => ({ ...s, [id]: undefined }));
  };

  const handleCaptionCommit = async (id, caption) => {
    if (savedCaptions.current.get(id) === caption) return;
    setCaptionStatus((s) => ({ ...s, [id]: "saving" }));
    try {
      await Photos.updateCaption(id, caption);
      savedCaptions.current.set(id, caption);
      setCaptionStatus((s) => ({ ...s, [id]: "saved" }));
      setTimeout(() => setCaptionStatus((s) => (s[id] === "saved" ? { ...s, [id]: undefined } : s)), 2000);
    } catch (error) {
      if (error?.status === 401) sessionExpired();
      setCaptionStatus((s) => ({ ...s, [id]: "error" }));
    }
  };

  // ----- Música -----

  const handleMusicFiles = async ([file]) => {
    const reason = validateFile(file, "music");
    if (reason) {
      setProblems({ title: "Não foi possível enviar a música", items: [{ name: file.name, reason }] });
      return;
    }
    setMusicUpload({ name: file.name, progress: 0 });
    try {
      const up = await UploadFile({
        file,
        folder: "music",
        onProgress: (p) => setMusicUpload((u) => (u ? { ...u, progress: p } : u)),
      });
      setField("background_music_url", up.file_url);
      toast.info("Música enviada. Clique em Salvar para aplicá-la.");
    } catch (error) {
      if (error?.status === 401) sessionExpired();
      else setProblems({ title: "Não foi possível enviar a música", items: [{ name: file.name, reason: friendlyError(error) }] });
    } finally {
      setMusicUpload(null);
    }
  };

  // ----- Confirmações -----

  const closeConfirm = () => !isRemoving && setConfirm(null);

  const confirmRemovePhoto = async () => {
    const { photo } = confirm;
    setIsRemoving(true);
    try {
      await Photos.remove(photo.id);
      savedCaptions.current.delete(photo.id);
      if (photo.preview) URL.revokeObjectURL(photo.preview);
      setPhotos((all) => all.filter((p) => p.id !== photo.id));
      toast.success("Foto removida.");
    } catch (error) {
      handleError(error, "Não foi possível remover a foto.");
    } finally {
      setIsRemoving(false);
      setConfirm(null);
    }
  };

  const confirmRemoveMusic = () => {
    setField("background_music_url", "");
    setConfirm(null);
    toast.info("Música removida. Clique em Salvar para aplicar.");
  };

  const confirmDiscard = () => {
    setDraft(saved);
    setConfirm(null);
    toast.info("Alterações descartadas.");
  };

  // ----- Telas -----

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Heart className="h-16 w-16 animate-pulse text-[#FF6B6B]" />
      </div>
    );
  }

  if (authState === "out") {
    return <LoginForm notice={loginNotice} onSuccess={() => { setLoginNotice(""); setAuthState("in"); }} />;
  }

  if (isLoading) return <DashboardSkeleton />;

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm space-y-4 text-center">
          <Heart className="mx-auto h-10 w-10 text-[#FF6B6B]" />
          <h1 className="text-xl font-semibold text-white">Não foi possível carregar</h1>
          <p className="text-sm text-white/60">
            Por segurança, a edição fica bloqueada para não sobrescrever seus dados com campos vazios.
          </p>
          <Button onClick={loadConfig}>Tentar de novo</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-4 pb-32 pt-20">
        <div className="mx-auto max-w-4xl space-y-8">
          <DashboardHeader dirty={dirty} onLogout={handleLogout} />
          <BasicInfoCard values={draft} onChange={setField} />
          <PhotosCard
            photos={photos}
            uploads={uploads}
            captionStatus={captionStatus}
            onFiles={handlePhotoFiles}
            onCaptionChange={handleCaptionChange}
            onCaptionCommit={handleCaptionCommit}
            onRemove={(photo) => setConfirm({ type: "photo", photo })}
          />
          <MusicCard
            url={draft.background_music_url}
            pending={draft.background_music_url !== saved.background_music_url}
            upload={musicUpload}
            onFiles={handleMusicFiles}
            onRemove={() => setConfirm({ type: "music" })}
          />
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={isSaving}
        disabled={!!musicUpload}
        onSave={handleSave}
        onDiscard={() => setConfirm({ type: "discard" })}
      />

      <ConfirmDialog
        open={confirm?.type === "photo"}
        title="Remover esta foto?"
        description="Ela sai da página principal e o arquivo é apagado. Não dá para desfazer."
        confirmLabel="Remover"
        destructive
        loading={isRemoving}
        onConfirm={confirmRemovePhoto}
        onCancel={closeConfirm}
      >
        {confirm?.photo && (
          <img src={confirm.photo.url} alt="" className="max-h-48 w-full rounded-lg object-cover" />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.type === "music"}
        title="Remover a música?"
        description="A página principal fica sem música depois que você salvar."
        confirmLabel="Remover"
        destructive
        onConfirm={confirmRemoveMusic}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        open={confirm?.type === "discard"}
        title="Descartar alterações?"
        description="Nome, data, frase e música voltam ao último estado salvo."
        confirmLabel="Descartar"
        destructive
        onConfirm={confirmDiscard}
        onCancel={closeConfirm}
      />

      <ConfirmDialog
        open={!!guard.pendingHref}
        title="Sair sem salvar?"
        description="Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas."
        confirmLabel="Sair sem salvar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={guard.confirmLeave}
        onCancel={guard.cancelLeave}
      />

      <MessageDialog
        open={!!problems}
        title={problems?.title}
        description={problems?.description}
        items={problems?.items}
        onClose={() => setProblems(null)}
      />
    </>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
