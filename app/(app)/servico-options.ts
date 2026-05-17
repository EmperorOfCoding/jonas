export const TIPOS_LAVAGEM = ["Completo", "Externo"] as const;

export const PRECO_POR_TIPO: Record<(typeof TIPOS_LAVAGEM)[number], string> = {
  Completo: "40",
  Externo: "30",
};

export const LOCAIS = ["Garagem", "Estacionamento", "Rua", "Condomínio"] as const;
export const PAGAMENTOS = ["Dinheiro", "Pix", "Cartão"] as const;
export const ANDARES = Array.from({ length: 30 }, (_, i) => `${i + 1}º`);
export const FUNCIONARIOS = ["Jonas", "Jackson", "Luis", "Rian", "Felipe", "Junior", "Lucas"];
