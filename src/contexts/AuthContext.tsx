import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Professor, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Session:', session?.user?.email, session?.user?.id);
        
        if (session?.user) {
          // Tenta trazer professor
          const { data: prof, error: queryError } = await supabase
            .from('professores')
            .select('*')
            .eq('id', session.user.id)
            .single();

          console.log('🔍 Professor query result:', prof, queryError);
          setDebugInfo({ sessionId: session.user.id, sessionEmail: session.user.email, profData: prof, profError: queryError });

          if (prof) {
            // Se tem professor, tenta sincronizar com Emusys
            syncWithEmusys(prof, session.user.email!);
            setProfessor(prof);
          } else if (queryError) {
            console.error('❌ Erro ao buscar professor:', queryError);
            setError(`Professor não encontrado: ${queryError.message}`);
          }
        }
      } catch (err) {
        console.error('❌ Auth check error:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔍 Auth state changed:', _event, session?.user?.email);
      if (session?.user) {
        supabase
          .from('professores')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            console.log('🔍 onAuthStateChange professor:', data, error);
            if (data) {
              syncWithEmusys(data, session.user.email!);
              setProfessor(data);
            } else if (error) {
              console.error('❌ onAuthStateChange error:', error);
              setError(`Professor não encontrado após login`);
            }
          });
      } else {
        setProfessor(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const syncWithEmusys = async (prof: Professor, email: string) => {
    try {
      const response = await fetch(`/api/professor?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const emusysProf = await response.json();
        console.log('✅ Emusys sync OK:', emusysProf);
        
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
      console.log('⚠️ Emusys sync opcional:', err);
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
      console.log('✅ Login bem-sucedido');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      console.error('❌ Login error:', message);
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

  // Expõe debugInfo pra testes
  (window as any).authDebug = debugInfo;

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
