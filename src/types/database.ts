export type Database = {
  public: {
    Tables: {
      aluno_perfil: {
        Row: {
          id: number
          aluno_id: number
          disciplina_id: number
          objetivo: string | null
          interesses_musicais: string[] | null
          nivel: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          aluno_id: number
          disciplina_id: number
          objetivo?: string | null
          interesses_musicais?: string[] | null
          nivel?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          aluno_id?: number
          disciplina_id?: number
          objetivo?: string | null
          interesses_musicais?: string[] | null
          nivel?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      aluno_avaliacao: {
        Row: {
          id: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero: number
          pontos_fortes: string | null
          pontos_fracos: string | null
          notas_adicionais: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero?: number
          pontos_fortes?: string | null
          pontos_fracos?: string | null
          notas_adicionais?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          aluno_id?: number
          disciplina_id?: number
          ciclo_numero?: number
          aula_numero?: number
          pontos_fortes?: string | null
          pontos_fracos?: string | null
          notas_adicionais?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      aula_conteudos: {
        Row: {
          id: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero: number
          conteudo: string
          cronograma_referencia: string | null
          criado_por_ia: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero: number
          conteudo: string
          cronograma_referencia?: string | null
          criado_por_ia?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          aluno_id?: number
          disciplina_id?: number
          ciclo_numero?: number
          aula_numero?: number
          conteudo?: string
          cronograma_referencia?: string | null
          criado_por_ia?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      aula_gravacao: {
        Row: {
          id: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero: number
          video_url: string | null
          duracao_segundos: number | null
          notas_professor: string | null
          uploaded_at: string
        }
        Insert: {
          id?: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          aula_numero: number
          video_url?: string | null
          duracao_segundos?: number | null
          notas_professor?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: number
          aluno_id?: number
          disciplina_id?: number
          ciclo_numero?: number
          aula_numero?: number
          video_url?: string | null
          duracao_segundos?: number | null
          notas_professor?: string | null
          uploaded_at?: string
        }
      }
      ajuste_manual: {
        Row: {
          id: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          descricao: string
          motivo: string | null
          aplicado_na_aula: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          aluno_id: number
          disciplina_id: number
          ciclo_numero: number
          descricao: string
          motivo?: string | null
          aplicado_na_aula?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          aluno_id?: number
          disciplina_id?: number
          ciclo_numero?: number
          descricao?: string
          motivo?: string | null
          aplicado_na_aula?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
