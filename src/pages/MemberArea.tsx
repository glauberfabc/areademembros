import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Module {
  id: string;
  title: string;
  image_url: string;
  is_locked: boolean;
  order_index: number;
}

export default function MemberArea() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Estudante');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchModules();
  }, []);

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
    } else {
      navigate('/');
    }
  }

  async function fetchModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) setModules(data);
    } catch (err) {
      console.error('Erro ao carregar módulos:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 flex-shrink-0 border-r border-primary/10 bg-white dark:bg-background-dark/50 flex flex-col h-full">
        <div className="p-6 flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div
              className="size-12 rounded-full overflow-hidden border-2 border-primary/20 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCBxsRlayPiuT2u1shoaYSHIts7jkwAGPzB2kFGiBzPXI0OAuc_6x-AgXHrsfBHxg_r4n5ZlFY_G5umGVfL_4K00XP18fiIufAvrwq7vdREdmgtkWfLcWBaOVMTPRKSbWMfSbIRISC5wB4mLbgNMw3ZHkqZzJ3l0kJDwKnIpBWOAljPxVqTAqeuLJO2AVtpAMw6rfagCCoyZaGXky_gmXZMNx9ERpSaI3KRbwOJGshGS_SXpmTcq6LC5opmULh7e2jmhs9UUBYLYC50')",
              }}
            ></div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold leading-tight">{userName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estudante Premium
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">grid_view</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <a
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">auto_stories</span>
              <span className="text-sm font-medium">Meus Cursos</span>
            </a>
            <a
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">folder_open</span>
              <span className="text-sm font-medium">Materiais</span>
            </a>
            <a
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">groups</span>
              <span className="text-sm font-medium">Comunidade</span>
            </a>
            <a
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined">support_agent</span>
              <span className="text-sm font-medium">Suporte</span>
            </a>
          </nav>
          <div className="pt-6 border-t border-primary/10 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg text-sm font-bold tracking-wide shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-base">
                workspace_premium
              </span>
              Ver Certificado
            </button>
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-base">settings</span>
                <span className="text-xs font-medium">Configurações</span>
              </div>
              <button onClick={handleLogout}>
                <span className="material-symbols-outlined text-base text-slate-400 hover:text-primary cursor-pointer">
                  logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">cake</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Mestre dos Ovos
              </h1>
              <p className="text-xs text-slate-500 font-medium">Seja bem-vindo de volta!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="w-64 pl-10 pr-4 py-2 bg-white dark:bg-white/5 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 transition-all"
                placeholder="Buscar módulo..."
                type="text"
              />
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Seus Módulos
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Continue sua jornada na confeitaria gourmet e domine a arte dos ovos de
                Páscoa.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map((modulo) => (
                <Link
                  key={modulo.id}
                  to={modulo.is_locked ? "#" : "/lesson"}
                  className={`group module-card relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white/5 shadow-xl shadow-black/5 hover:-translate-y-2 transition-all duration-300 ${modulo.is_locked ? 'opacity-90 grayscale-[0.3] hover:grayscale-0 cursor-not-allowed' : ''}`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('${modulo.image_url}')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-[10px] font-bold text-white uppercase tracking-wider">
                      Módulo {String(modulo.order_index).padStart(2, '0')}
                    </div>
                    {modulo.is_locked ? (
                      <div className="absolute top-3 right-3 text-white/50 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">lock</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined fill-1">play_arrow</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                      {modulo.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
