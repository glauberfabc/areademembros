import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (user) {
        // Buscar a role do usuário no perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/modules');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center font-display antialiased">
      <div className="fixed inset-0 easter-egg-pattern pointer-events-none"></div>
      <div className="relative w-full max-w-[1100px] min-h-[700px] flex flex-col md:flex-row shadow-2xl rounded-xl overflow-hidden m-4 z-10">
        <div className="hidden md:flex md:w-1/2 relative bg-primary overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyB05FqHs40jCLqQQRbnOMfLtOUS7xwwEXLZzdlbwUqj_cPeavI0zJeL2HQIP0VEx3WXMdOEbgi8BsV9mZR_f3UUDhQ0jDJKuzlD3C-_M5F13Wv7jTuxbALkZoUfbCD19P21OPKWbOUR41ge2Uve8chdhJtGNmX5AXSsA5EKj8-OKF5TJhL98jl63W2lCnQsBKDny8UD0nqYmNuRZUMOQWqdgPr75T1wZzsLFks6W-OaD6qN40xVIJfTh0ujmUaDtqJ3yFBMp0o14e')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary bg-white rounded-full p-2">
                bakery_dining
              </span>
              <span className="text-sm font-bold tracking-widest uppercase">
                Premium Masterclass
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              A arte do chocolate gourmet na sua cozinha.
            </h1>
            <p className="text-slate-200 text-lg">
              Aprenda as técnicas dos grandes mestres e transforme sua paixão em um
              negócio lucrativo.
            </p>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-background-dark/90 px-8 py-12 md:px-16 justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <svg
                className="size-6"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Mestre dos Ovos de Páscoa
            </h2>
          </div>
          <div className="mb-10">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Bem-vindo, Mestre!
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Insira suas credenciais para acessar sua área de membros.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                htmlFor="email"
              >
                E-mail ou Usuário
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  mail
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400"
                  id="email"
                  placeholder="exemplo@email.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
                  Senha
                </label>
                <a
                  className="text-sm font-bold text-primary hover:underline transition-all"
                  href="#"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-12 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  type="button"
                >
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-700"
                id="remember"
                type="checkbox"
              />
              <label
                className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-400"
                htmlFor="remember"
              >
                Lembrar de mim por 30 dias
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Acessando...' : 'Acessar Curso'}</span>
              {!loading && (
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
          </form>
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Ainda não é um aluno?{' '}
              <a className="text-primary font-bold hover:underline" href="#">
                Comece agora
              </a>
            </p>
          </div>
          <div className="mt-auto pt-8 flex justify-center gap-6">
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined">help</span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined">contact_support</span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined">language</span>
            </a>
          </div>
        </div>
      </div>
      <div className="md:hidden fixed inset-0 z-0 opacity-10">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA95wzwBTRg53BiYjQqi5EeQXVsiqSk-hR17kUkZSp-N68BpIPlpq2FZvEFQOLN1CoAcAQZSl81iHK431TazcE5gnyNMzbVZciV0FiKBwsyXTXD1DXVqGsDn_M4UesysQz6IpnkwYFt_N9zdvB6H7vM7aevj-DNPuG3e8MvBfdAirnXkoA36HaN8yjct5L0ZkBEN_yZGQ0PZ-Eo8L-6XWs297PNeYJHNCe5rMNPZnv2occubL3RU6AFyaS_yn1qbogJYRkkopSaj4Sr')",
          }}
        ></div>
      </div>
    </div>
  );
}
