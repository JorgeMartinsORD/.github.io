export interface Professor {
  id: string;
  email: string;
  nome: string;
  created_at: string;
}

export interface Aluno {
  id: string;
  professor_id: string;
  modalidade_id: string;
  nome: string;
  idade: number;
  musica_objetivo: string;
  objetivo_aprendizado: string;
  nivel_inicial?: string;
  conteudo_atual?: string;
  ativo: boolean;
  created_at: string;
}

export interface AuthContextType {
  professor: Professor | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
