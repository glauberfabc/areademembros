import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ students: 0, lessons: 0, modules: 0 });
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lessons' | 'students' | 'modules'>('dashboard');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
    fetchInitialData();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      navigate('/modules');
    }
  }

  async function fetchInitialData() {
    // Buscar módulos para o select e para a lista
    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .order('order_index');
    if (modulesData) {
      setModules(modulesData);
      setModulesList(modulesData);
    }

    // Buscar lista completa de aulas
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        video_url,
        pdf_url,
        created_at,
        modules (title)
      `)
      .order('created_at', { ascending: false });
    if (lessonsData) setLessonsList(lessonsData);

    // Buscar lista de alunos
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (studentsData) setStudentsList(studentsData);

    // Buscar estatísticas básicas
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: lessonCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
    const { count: moduleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });

    setStats({
      students: studentCount || 0,
      lessons: lessonCount || 0,
      modules: moduleCount || 0
    });
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return alert('Selecione um módulo');

    setLoading(true);
    setUploading(true);
    try {
      let currentPdfUrl = pdfUrl;

      // Upload do PDF se houver um novo arquivo
      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `lesson-materials/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        currentPdfUrl = publicUrlData.publicUrl;
      }

      const lessonData = {
        module_id: selectedModule,
        title,
        video_url: videoUrl,
        description,
        pdf_url: currentPdfUrl
      };

      if (editingLessonId) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLessonId);

        if (error) throw error;
        alert('Aula atualizada com sucesso!');
        setEditingLessonId(null);
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);

        if (error) throw error;
        alert('Aula salva com sucesso!');
      }

      setTitle('');
      setVideoUrl('');
      setDescription('');
      setSelectedModule('');
      setPdfFile(null);
      setPdfUrl(null);
      fetchInitialData();
    } catch (err: any) {
      alert('Erro ao salvar aula: ' + err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEditClick = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setVideoUrl(lesson.video_url || '');
    setDescription(lesson.description || '');
    setSelectedModule(lesson.module_id || '');
    setPdfUrl(lesson.pdf_url || null);
    setPdfFile(null);
    setActiveTab('dashboard');
  };

  const handleCancelEdit = () => {
    setEditingLessonId(null);
    setTitle('');
    setVideoUrl('');
    setDescription('');
    setSelectedModule('');
    setPdfFile(null);
    setPdfUrl(null);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;

    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchInitialData();
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(`Deseja alterar a role deste usuário para ${newRole}?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) alert('Erro ao atualizar role: ' + error.message);
    else fetchInitialData();
  };

  const handleToggleModuleLock = async (moduleId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('modules')
      .update({ is_locked: !currentStatus })
      .eq('id', moduleId);

    if (error) alert('Erro ao atualizar módulo: ' + error.message);
    else fetchInitialData();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-primary/10 bg-white dark:bg-zinc-900 flex flex-col fixed h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">egg_alt</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Easter Egg</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'lessons' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              Aulas
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'modules' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              <span className="material-symbols-outlined text-[20px]">view_module</span>
              Módulos
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'students' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              Alunos
            </button>
          </nav>
          <div className="p-4 mt-auto border-t border-slate-100 dark:border-zinc-800">
            <Link to="/modules" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors mt-2">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Voltar ao App
            </Link>
          </div>
        </aside>
        <main className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">
                {activeTab === 'dashboard' && 'Visão Geral'}
                {activeTab === 'lessons' && 'Gerenciar Aulas'}
                {activeTab === 'modules' && 'Gerenciar Módulos'}
                {activeTab === 'students' && 'Gerenciar Alunos'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">Bem-vindo ao painel administrativo.</p>
            </div>
            {activeTab === 'lessons' && (
              <button
                onClick={() => {
                  handleCancelEdit();
                  setActiveTab('dashboard');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nova Aula
              </button>
            )}
          </header>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total de Alunos</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.students}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aulas Publicadas</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.lessons}</h3>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Módulos</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.modules}</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      {editingLessonId ? 'edit' : 'video_call'}
                    </span>
                    {editingLessonId ? 'Editar Aula' : 'Cadastrar Nova Aula'}
                  </h3>
                  <form className="space-y-4" onSubmit={handleSaveLesson}>
                    <div>
                      <label className="block text-sm font-medium mb-1">Módulo</label>
                      <select
                        className="w-full rounded-lg border-slate-200 dark:border-zinc-700 bg-transparent"
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        required
                      >
                        <option value="">Selecione um módulo</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Título da Aula</label>
                      <input
                        className="w-full rounded-lg border-slate-200 dark:border-zinc-700 bg-transparent"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">URL do Vídeo</label>
                      <input
                        className="w-full rounded-lg border-slate-200 dark:border-zinc-700 bg-transparent"
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <textarea
                        className="w-full rounded-lg border-slate-200 dark:border-zinc-700 bg-transparent"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Material de Apoio (PDF)</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-800/20">
                          <div className="flex-1">
                            {pdfFile ? (
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">picture_as_pdf</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium truncate">{pdfFile.name}</span>
                                  <span className="text-[10px] text-slate-500">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPdfFile(null)}
                                  className="text-xs text-red-500 font-bold hover:underline ml-auto"
                                >Remover</button>
                              </div>
                            ) : pdfUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                <span className="text-sm font-medium">PDF já carregado</span>
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary font-bold hover:underline"
                                >Ver arquivo</a>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">Selecione um arquivo PDF para esta aula</p>
                            )}
                          </div>
                          <label className="cursor-pointer bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-zinc-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0">
                            {pdfUrl || pdfFile ? 'Alterar' : 'Escolher PDF'}
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && file.size > 100 * 1024 * 1024) {
                                  alert('O arquivo é muito grande! O limite máximo é de 100MB.');
                                  return;
                                }
                                setPdfFile(file || null);
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-400 italic px-1">Limite máximo: 100MB</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        className="flex-[2] py-3 bg-primary text-white rounded-lg font-bold disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : editingLessonId ? 'Atualizar Aula' : 'Salvar Aula'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </>
          )}

          {activeTab === 'lessons' && (
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800/50">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aula</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {lessonsList.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-sm">{lesson.title}</span>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{lesson.video_url}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {lesson.modules?.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(lesson)}
                              className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              title="Editar Aula"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                              title="Excluir Aula"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'modules' && (
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800/50">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Módulo</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ordem</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {modulesList.map((module) => (
                      <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="size-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                            {module.image_url && <img src={module.image_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-medium text-sm">{module.title}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {module.order_index}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${module.is_locked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {module.is_locked ? 'Bloqueado' : 'Desbloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleModuleLock(module.id, module.is_locked)}
                            className={`text-xs font-bold hover:underline ${module.is_locked ? 'text-emerald-600' : 'text-amber-600'}`}
                          >
                            {module.is_locked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'students' && (
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-800/50">
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cadastro</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {studentsList.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-sm">{student.full_name || 'Usuário Sem Nome'}</span>
                          <p className="text-xs text-slate-400 italic">{student.id.substring(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${student.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {student.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(student.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleRole(student.id, student.role)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Alternar Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
