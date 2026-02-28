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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    setIsSidebarOpen(false); // Fecha no mobile ao clicar
  };

  const handleLessonClick = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setSearchParams({ module: activeModuleId!, lesson: lesson.id });
    // No mobile, após selecionar aula, opcionalmente rolar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {/* Overlay para mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar de Módulos */}
        <aside className={`fixed inset-y-0 left-0 w-72 lg:relative z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0 overflow-y-auto`}>
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-lg p-2 text-white">
                  <span className="material-symbols-outlined text-2xl">bakery_dining</span>
                </div>
                <h1 className="text-sm font-bold uppercase tracking-wider text-primary">Mestre dos Ovos</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-stone-400">
                <span className="material-symbols-outlined">close</span>
              </button>
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

        <main className="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark w-full">
          {/* Header */}
          <header className="h-16 lg:h-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-stone-600 dark:text-stone-300"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <Link to="/modules" className="hidden xs:flex material-symbols-outlined text-stone-400 hover:text-primary transition-colors">
                chevron_left
              </Link>
              <h2 className="font-bold text-xs lg:text-base text-stone-800 dark:text-stone-100 truncate">
                <span className="hidden sm:inline">{modules.find(m => m.id === activeModuleId)?.title} / </span>
                <span className="text-primary">{activeLesson?.title || 'Selecione uma aula'}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-tight">{userName}</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">Estudante VIP</p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 border border-primary/50 overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=E11D48&color=fff`} alt="Avatar" />
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Player de Vídeo ou Link de Material */}
              <div className="aspect-video bg-black/5 dark:bg-black/20 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
                {activeLesson?.video_url ? (
                  activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 lg:p-10 text-center bg-gradient-to-br from-primary/5 to-primary/20 backdrop-blur-sm">
                      <div className="size-14 lg:size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 lg:mb-6 animate-pulse">
                        <span className="material-symbols-outlined text-3xl lg:text-5xl">folder_zip</span>
                      </div>
                      <h4 className="text-base lg:text-xl font-black mb-2 text-slate-900 dark:text-white uppercase tracking-tight">Material Disponível para Download</h4>
                      <p className="text-[10px] lg:text-sm text-slate-500 dark:text-slate-400 mb-6 lg:mb-8 max-w-sm">Esta aula contém materiais externos no Google Drive.</p>
                      <a
                        href={activeLesson.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 bg-primary text-white rounded-xl lg:rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group text-xs lg:text-base"
                      >
                        <span className="material-symbols-outlined text-sm lg:text-base">open_in_new</span>
                        Acessar no Google Drive
                        <span className="hidden sm:block material-symbols-outlined text-xs opacity-50 group-hover:translate-x-1 transition-transform">arrow_forward</span>
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
                    <span className="material-symbols-outlined text-4xl lg:text-6xl mb-4">play_circle</span>
                    <p className="text-sm lg:text-base">Selecione uma aula para começar</p>
                  </div>
                )}
              </div>

              {/* Informações da Aula */}
              {activeLesson && (
                <div className="bg-white dark:bg-stone-900 p-5 lg:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <h3 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-4">
                    {activeLesson.title}
                  </h3>
                  <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none text-stone-600 dark:text-stone-400">
                    <p className="leading-relaxed">{activeLesson.description || 'Sem descrição disponível para esta aula.'}</p>
                  </div>

                  {(activeLesson.pdf_url || (activeLesson.video_url && activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/))) && (
                    <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                      <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-base">cloud_download</span>
                        Materiais e Downloads
                      </h4>
                      <div className="flex flex-wrap gap-3 lg:gap-4">
                        {activeLesson.pdf_url && (
                          <a
                            href={activeLesson.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center lg:justify-start gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-stone-50 dark:bg-stone-800/50 hover:bg-rose-500 hover:text-white rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all border border-stone-100 dark:border-stone-800 group"
                          >
                            <span className="material-symbols-outlined text-rose-500 group-hover:text-white text-base lg:text-lg">picture_as_pdf</span>
                            Guia PDF
                          </a>
                        )}
                        {activeLesson.video_url && activeLesson.video_url.match(/drive\.google\.com|docs\.google\.com/) && (
                          <a
                            href={activeLesson.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center lg:justify-start gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-primary/5 hover:bg-primary hover:text-white rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all border border-primary/10 group"
                          >
                            <span className="material-symbols-outlined text-primary group-hover:text-white text-base lg:text-lg">folder_shared</span>
                            Drive
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
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 lg:p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2 text-stone-400">
                  <span className="material-symbols-outlined text-primary text-base">playlist_play</span>
                  Aulas deste Módulo
                </h4>
                <div className="space-y-2">
                  {lessons.length > 0 ? (
                    lessons.map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${activeLesson?.id === lesson.id
                          ? 'border-primary bg-primary/5'
                          : 'border-stone-100 dark:border-stone-800 hover:border-primary/30'
                          }`}
                      >
                        <div className={`size-7 lg:size-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold shrink-0 ${activeLesson?.id === lesson.id ? 'bg-primary text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors'
                          }`}>
                          {idx + 1}
                        </div>
                        <span className={`text-xs lg:text-sm font-medium truncate ${activeLesson?.id === lesson.id ? 'text-primary' : 'text-stone-600 dark:text-stone-300'}`}>
                          {lesson.title}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[10px] lg:text-xs text-stone-400 italic">Nenhuma aula cadastrada.</p>
                  )}
                </div>
              </div>

              <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="relative z-10">
                  <h5 className="font-bold text-base lg:text-lg mb-1 lg:mb-2">Dúvidas?</h5>
                  <p className="text-white/80 text-[10px] lg:text-xs mb-4">Entre no nosso grupo exclusivo no WhatsApp.</p>
                  <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform">Acessar Comunidade</button>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-500">forum</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
