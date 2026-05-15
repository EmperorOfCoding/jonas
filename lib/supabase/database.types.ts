export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      servicos: {
        Row: {
          id: string | number;
          placa: string | null;
          tipo_lavagem: string | null;
          andar: string | null;
          local: string | null;
          funcionario: string | null;
          data_hora: string | null;
          forma_pagamento: string | null;
          valor: number | string | null;
        };
        Insert: {
          id?: string | number;
          placa: string;
          tipo_lavagem: string;
          andar: string;
          local: string;
          funcionario: string;
          data_hora: string;
          forma_pagamento: string;
          valor: number;
        };
        Update: {
          id?: string | number;
          placa?: string;
          tipo_lavagem?: string;
          andar?: string;
          local?: string;
          funcionario?: string;
          data_hora?: string;
          forma_pagamento?: string;
          valor?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
