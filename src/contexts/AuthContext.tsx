import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Professor, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Traz professor do Supabase
          const { data: prof } = await supabase
            .from('professores')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Se tem professor, tenta sincronizar com Emusys
          if (prof) {
            syncWithEmusys(prof, session.user.email!);
            setProfessor(prof);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('professores')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              syncWithEmusys(data, session.user.email!);
              setProfessor(data);
            }
          });
      } else {
        setProfessor(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Sincroniza professor com Emusys (traz nome, telefone, etc)
  const syncWithEmusys = async (prof: Professor, email: string) => {
    try {
      const response = await fetch(`/api/professor?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const emusysProf = await response.json();
        
        // Atualiza professor com dados do Emusys
        if (emusysProf?.pessoa?.nome) {
          await supabase
            .from('professores')
            .update({
              nome: emusysProf.pessoa.nome,
              email: emusysProf.pessoa.email || email,
            })
            .eq('id', prof.id);
        }
      }
    } catch (err) {
      // Emusys pode não ter o professor, e tudo bem
      console.log('Emusys sync opcional:', err);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      // Não precisa fazer nada aqui - onAuthStateChange vai cuidar
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
      setProfessor(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer logout';
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ professor, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
