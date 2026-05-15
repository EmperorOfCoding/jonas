"use server";

import { revalidatePath } from "next/cache";
import {
  deleteServico,
  ServicosError,
  updateServico,
  type UpdateServicoInput,
} from "@/lib/services/servicos";

function revalidateServicoViews() {
  revalidatePath("/atividades");
  revalidatePath("/dashboard");
  revalidatePath("/registro");
  revalidatePath("/relatorio");
}

export async function atualizarServico(id: string | number, input: UpdateServicoInput) {
  try {
    await updateServico(id, input);
    revalidateServicoViews();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ServicosError) {
      return { ok: false as const, message: error.message };
    }

    return { ok: false as const, message: "Nao foi possivel atualizar o servico." };
  }
}

export async function excluirServico(id: string | number) {
  try {
    await deleteServico(id);
    revalidateServicoViews();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ServicosError) {
      return { ok: false as const, message: error.message };
    }

    return { ok: false as const, message: "Nao foi possivel excluir o servico." };
  }
}
