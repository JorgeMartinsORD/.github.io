import { createContext, useContext, useState, type ReactNode } from 'react';

interface Professor {
  id: string;
  nome: string;
  email: string;
}

interface ProfessorContextType {
  professorSelecionado: Professor | null;
  setProfessor: (professor: Professor) => void;
  logout: () => void;
}

const ProfessorContext = createContext<ProfessorContextType | undefined>(undefined);

export const ProfessorProvider = ({ children }: { children: ReactNode }) => {
  const [professorSelecionado, setProfessorSelecionado] = useState<Professor | null>(null);

  const setProfessor = (professor: Professor) => {
    setProfessorSelecionado(professor);
  };

  const logout = () => {
    setProfessorSelecionado(null);
  };

  return (
    <ProfessorContext.Provider value={{ professorSelecionado, setProfessor, logout }}>
      {children}
    </ProfessorContext.Provider>
  );
};

export const useProfessor = () => {
  const context = useContext(ProfessorContext);
  if (!context) {
    throw new Error('useProfessor deve ser usado dentro de ProfessorProvider');
  }
  return context;
};
