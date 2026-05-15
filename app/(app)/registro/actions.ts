"use server";

import { revalidatePath } from "next/cache";
import {
  countServicos,
  createServico,
  periodoStart,
  type CreateServicoInput,
  ServicosError,
} from "@/lib/services/servicos";

export async function carregarResumoRegistro() {
  try {
    const carrosHoje = await countServicos({ from: periodoStart("hoje") });
    return { ok: true as const, carrosHoje };
  } catch (error) {
    if (error instanceof ServicosError) {
      return { ok: false as const, message: error.message };
    }

    return { ok: false as const, message: "Nao foi possivel carregar o resumo." };
  }
}

export async function registrarServico(input: CreateServicoInput) {
  try {
    await createServico(input);
    revalidatePath("/dashboard");
    revalidatePath("/relatorio");
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ServicosError) {
      return { ok: false as const, message: error.message };
    }

    return { ok: false as const, message: "Nao foi possivel registrar o servico." };
  }
}
