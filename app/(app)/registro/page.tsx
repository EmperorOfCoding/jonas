import { carregarResumoRegistro } from "./actions";
import RegistroClient from "./RegistroClient";

export default async function RegistroPage() {
  const result = await carregarResumoRegistro();
  const carrosHoje = result.ok ? result.carrosHoje : null;

  return <RegistroClient initialCarrosHoje={carrosHoje} />;
}
