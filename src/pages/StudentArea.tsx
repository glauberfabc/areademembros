import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string;
  description: string;
  pdf_url?: string;
}

interface Module {
  id: string;
  title: string;
}

export default function StudentArea() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [userName, setUserName] = useState('Estudante');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeModuleId) {
      fetchLessons(activeModuleId);
    }
  }, [activeModuleId]);

  async function fetchInitialData() {
    try {
      // 1. Verificar Autenticação e Perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) setUserName(profile.full_name);
      else if (user.email) setUserName(user.email.split('@')[0]);

      // 2. Buscar Módulos
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title')
        .order('order_index');

      if (modulesData && modulesData.length > 0) {
        setModules(modulesData);

        // Verificar se tem módulo no URL, senão pega o primeiro
        const urlModuleId = searchParams.get('module');
        const initialModuleId = urlModuleId || modulesData[0].id;
        setActiveModuleId(initialModuleId);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLessons(moduleId: string) {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId);

    if (data) {
      setLessons(data);

      // Se tiver aula no URL, seleciona ela, senão pega a primeira do módulo
      const urlLessonId = searchParams.get('lesson');
      const lessonToSelect = data.find(l => l.id === urlLessonId) || data[0];
      setActiveLesson(lessonToSelect || null);
    }
  }

  const handleModuleClick = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setSearchParams({ module: moduleId });
  };

  const handleLessonClick = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setSearchParams({ module: activeModuleId!, lesson: lesson.id });
  };

  // Função para transformar URL de vídeo em embed
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    if (url.includes('vimeo.com/')) {
      return url.replace('vimeo.com/', 'player.vimeo.com/video/');
    }
    if (url.includes('wistia.com/medias/')) {
      const videoId = url.split('wistia.com/medias/')[1]?.split('?')[0];
      return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar de Módulos */}
        <aside className="w-72 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary rounded-lg p-2 text-white">
                <span className="material-symbols-outlined text-2xl">bakery_dining</span>
              </div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-primary">Mestre dos Ovos</h1>
            </div>
            <nav className="flex flex-col gap-1">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModuleClick(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${activeModuleId === m.id
                    ? 'text-primary bg-primary/5 font-bold'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                >
                  <span className={`material-symbols-outlined ${activeModuleId === m.id ? 'fill-1' : ''}`}>
                    menu_book
                  </span>
                  <span className="text-sm truncate">{m.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark">
          {/* Header */}
          <header className="h-20 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Link to="/modules" className="material-symbols-outlined text-stone-400 hover:text-primary transition-colors">
                chevron_left
              </Link>
              <h2 className="font-bold text-stone-800 dark:text-stone-100">
                {modules.find(m => m.id === activeModuleId)?.title} / <span className="text-primary">{activeLesson?.title || 'Selecione uma aula'}</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold leading-tight">{userName}</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">Estudante VIP</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=E11D48&color=fff`} alt="Avatar" />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Player de Vídeo ou Link de Material */}
              <div className="aspect-video bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
                {activeLesson?.video_url ? (
                  activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br from-primary/5 to-primary/20 backdrop-blur-sm">
                      <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                        <span className="material-symbols-outlined text-5xl">folder_zip</span>
                      </div>
                      <h4 className="text-xl font-black mb-3 text-slate-900 dark:text-white uppercase tracking-tight">Material Disponível para Download</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Esta aula contém materiais externos. Clique no botão abaixo para acessar os arquivos no Google Drive.</p>
                      <a
                        href={activeLesson.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        Acessar no Google Drive
                        <span className="material-symbols-outlined text-xs opacity-50 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </a>
                    </div>
                  ) : (
                    <iframe
                      src={getEmbedUrl(activeLesson.video_url)}
                      className="w-full h-full"
                      allowFullScreen
                      title={activeLesson.title}
                    ></iframe>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-500">
                    <span className="material-symbols-outlined text-6xl mb-4">play_circle</span>
                    <p>Selecione uma aula para começar</p>
                  </div>
                )}
              </div>

              {/* Informações da Aula */}
              {activeLesson && (
                <div className="bg-white dark:bg-stone-900 p-8 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      {activeLesson.title}
                    </h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-400">
                    <p className="leading-relaxed">{activeLesson.description || 'Sem descrição disponível para esta aula.'}</p>
                  </div>

                  {(activeLesson.pdf_url || (activeLesson.video_url && activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/))) && (
                    <div className="mt-10 pt-8 border-t border-stone-100 dark:border-stone-800">
                      <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-xl">cloud_download</span>
                        Materiais e Downloads
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        {activeLesson.pdf_url && (
                          <a
                            href={activeLesson.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-4 bg-stone-50 dark:bg-stone-800/50 hover:bg-rose-500 hover:text-white rounded-2xl text-sm font-bold transition-all border border-stone-100 dark:border-stone-800 group shadow-sm"
                          >
                            <span className="material-symbols-outlined text-rose-500 group-hover:text-white">picture_as_pdf</span>
                            Guia PDF da Aula
                            <span className="material-symbols-outlined text-[10px] opacity-30 group-hover:opacity-100">launch</span>
                          </a>
                        )}
                        {activeLesson.video_url && activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/) && (
                          <a
                            href={activeLesson.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-4 bg-primary/5 hover:bg-primary hover:text-white rounded-2xl text-sm font-bold transition-all border border-primary/10 group shadow-sm"
                          >
                            <span className="material-symbols-outlined text-primary group-hover:text-white">folder_shared</span>
                            Link Direto (Drive)
                            <span className="material-symbols-outlined text-[10px] opacity-30 group-hover:opacity-100">launch</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Aulas do Módulo */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">playlist_play</span>
                  Aulas deste Módulo
                </h4>
                <div className="space-y-2">
                  {lessons.length > 0 ? (
                    lessons.map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${activeLesson?.id === lesson.id
                          ? 'border-primary bg-primary/5'
                          : 'border-stone-100 dark:border-stone-800 hover:border-primary/30'
                          }`}
                      >
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${activeLesson?.id === lesson.id ? 'bg-primary text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                          }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-sm font-medium truncate ${activeLesson?.id === lesson.id ? 'text-primary' : 'text-stone-600 dark:text-stone-300'}`}>
                          {lesson.title}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400 italic">Nenhuma aula cadastrada neste módulo.</p>
                  )}
                </div>
              </div>

              <div className="bg-primary rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <h5 className="font-bold text-lg mb-2 relative z-10">Dúvidas?</h5>
                <p className="text-white/80 text-xs mb-4 relative z-10">Entre no nosso grupo exclusivo no WhatsApp.</p>
                <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold relative z-10">Acessar Comunidade</button>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-white/10 rotate-12">forum</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
