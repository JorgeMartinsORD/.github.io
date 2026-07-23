import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, error: authError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(authError || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    // Validação
    if (password !== confirmPassword) {
      setLocalError('Senhas não conferem');
      return;
    }

    if (password.length < 6) {
      setLocalError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccessMsg('✅ Conta criada! Faça login com suas credenciais.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsRegistering(false);
        setSuccessMsg(null);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar';
      setLocalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🎵 Plataforma IA Professores</h1>
        <p className="subtitle">Planeje suas aulas com inteligência artificial</p>

        {!isRegistering ? (
          // FORMULÁRIO DE LOGIN
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {(authError || localError) && (
              <div className="error-message">{authError || localError}</div>
            )}

            <button type="submit" disabled={isLoading} className="submit-button">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="toggle-auth">
              <p>Não tem conta? 
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setLocalError(null);
                    setEmail('');
                    setPassword('');
                  }}
                  className="toggle-link"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </form>
        ) : (
          // FORMULÁRIO DE REGISTRO
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Senha</label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <small>Mínimo 6 caracteres</small>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirmar Senha</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {(localError || successMsg) && (
              <div className={localError ? "error-message" : "success-message"}>
                {localError || successMsg}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="submit-button">
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>

            <div className="toggle-auth">
              <p>Já tem conta? 
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setLocalError(null);
                    setEmail('');
                    setPassword('');
                  }}
                  className="toggle-link"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="info">
          <p><small>A plataforma sincroniza automaticamente com seus dados do Emusys.</small></p>
        </div>
      </div>
    </div>
  );
};
