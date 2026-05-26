export const TIPOS_LAVAGEM = ["Completo", "Externo"] as const;

export const PRECO_POR_TIPO: Record<(typeof TIPOS_LAVAGEM)[number], string> = {
  Completo: "40",
  Externo: "30",
};

export const LOCAIS = ["Horto", "Vale do Loire", "Barra", "Barcelona"] as const;
export const PAGAMENTOS = ["Dinheiro", "Pix", "Cartão"] as const;
export const ANDARES = ["Torre A", "Torre B"] as const;
export const FUNCIONARIOS = ["Jonas", "Rian", "Felipe", "Junior", "Lucas", "Jackson", "Luis"];

