import { NextRequest } from "next/server";
import {
  getParteFuncionario,
  listServicos,
  parseReportRange,
  ServicosError,
  summarizeServicos,
} from "@/lib/services/servicos";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function GET(request: NextRequest) {
  try {
    const { inicio, fim, from, to } = parseReportRange(
      request.nextUrl.searchParams.get("inicio"),
      request.nextUrl.searchParams.get("fim")
    );
    const filterTorre = request.nextUrl.searchParams.get("torre");
    const filterLocal = request.nextUrl.searchParams.get("local");
    const filterServico = request.nextUrl.searchParams.get("servico");
    const filterAndarApto = request.nextUrl.searchParams.get("andarApto");
    const filterEquipe = request.nextUrl.searchParams.getAll("equipe");
    const query = request.nextUrl.searchParams.get("q");
    const isCliente = request.nextUrl.searchParams.get("tipo") === "cliente";

    let lista = await listServicos({ from, to });
    if (filterTorre) {
      lista = lista.filter((s) => s.andar === filterTorre);
    }
    if (filterLocal) {
      lista = lista.filter((s) => s.local === filterLocal);
    }
    if (filterServico) {
      lista = lista.filter((s) => s.tipo_lavagem?.toLowerCase() === filterServico.toLowerCase());
    }
    if (filterAndarApto) {
      lista = lista.filter((s) => s.placa?.toLowerCase() === filterAndarApto.toLowerCase());
    }
    if (filterEquipe.length > 0) {
      lista = lista.filter((s) => {
        if (!s.funcionario) return false;
        const funcsStr = s.funcionario.split(",").map((f) => f.trim().toLowerCase());
        return filterEquipe.some(e => funcsStr.includes(e.toLowerCase()));
      });
    }
    if (query) {
      const q = query.trim().toUpperCase();
      lista = lista.filter((s) => s.placa.toUpperCase().includes(q));
    }

    lista.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    const resumo = summarizeServicos(lista);
    const printableRows = lista.slice(0, 500); // Allow more rows for HTML printing since pages paginate naturally
    const truncated = lista.length > printableRows.length;

    // Build modern, clean HTML UI
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Jonas Lavagem</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    :root {
      --text-main: #111827;
      --text-muted: #6b7280;
      --border-color: #e5e7eb;
      --bg-header: #f9fafb;
      --accent: #2563eb;
    }
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-main);
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Print settings */
    @page { 
      margin: 0; /* Remove headers and footers from browser */
      size: A4 portrait; 
    }
    
    @media print {
      body { 
        padding: 0; 
        background-color: #ffffff !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
      }
      .no-print { display: none !important; }
      .page-container {
        padding: 2cm !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: none !important;
      }
    }

    .page-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      background: #fff;
    }

    /* Helper Banner */
    .banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
      padding: 16px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 40px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .header-title h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
    }
    .header-title p {
      margin: 0;
      color: #64748b;
      font-size: 16px;
      font-weight: 500;
    }
    .header-meta {
      text-align: right;
      background: #f8fafc;
      padding: 16px 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(${isCliente ? 3 : 5}, minmax(0, 1fr));
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 40px;
    }
    .summary-item {
      padding: 16px 10px;
      border-right: 1px solid #e2e8f0;
    }
    .summary-item:last-child {
      border-right: none;
    }
    .summary-item.highlight {
      background: #eff6ff;
    }
    .summary-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .summary-item.highlight .summary-label {
      color: #2563eb;
    }
    .summary-value {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      white-space: nowrap;
    }
    .summary-item.highlight .summary-value {
      color: #1d4ed8;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 30px;
    }
    th {
      background: #ffffff;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }
    /* Add subtle hover/zebra for screen, but keep it clean for print */
    tr:nth-child(even) td {
      background-color: #fafcc; /* extremely subtle for screen */
    }
    @media print {
      tr:nth-child(even) td { background-color: #ffffff !important; }
    }
    .text-right { text-align: right; }
    
    .cell-data { color: #64748b; }
    .cell-placa { font-weight: 600; color: #0f172a; }
    .cell-equipe { color: #475569; font-size: 11px; max-width: 150px; line-height: 1.4; }
    .cell-valor { font-weight: 700; color: #0f172a; }

    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand p {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }
    .footer-brand span {
      color: #0f172a;
    }
    .footer-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="banner no-print">
      Dica: Selecione <strong>"Salvar como PDF"</strong> ou <strong>"Imprimir para PDF"</strong> na janela do sistema para baixar o arquivo.
    </div>

    <div class="header">
      <div class="header-title">
        <h1>Relatório de Atividades</h1>
        <p>Jonas Lavagem Automotiva</p>
      </div>
      <div class="header-meta">
        <p class="meta-label">Período</p>
        <p class="meta-value">${inicio} até ${fim}</p>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Serviços</div>
        <div class="summary-value">${resumo.totalServicos}</div>
      </div>
      <div class="summary-item ${isCliente ? 'highlight' : ''}">
        <div class="summary-label">Ticket Médio</div>
        <div class="summary-value">${formatMoney(resumo.ticketMedio)}</div>
      </div>
      <div class="summary-item ${!isCliente ? 'highlight' : ''}">
        <div class="summary-label">Receita Total</div>
        <div class="summary-value">${formatMoney(resumo.receitaTotal)}</div>
      </div>
      ${!isCliente ? `
      <div class="summary-item">
        <div class="summary-label">Parte Empresa</div>
        <div class="summary-value">${formatMoney(resumo.parteCEO)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Funcionários</div>
        <div class="summary-value">${formatMoney(resumo.parteFuncionarios)}</div>
      </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Veículo / Placa</th>
          <th>Serviço</th>
          <th>Localização</th>
          <th>Equipe</th>
          <th class="text-right">${isCliente ? 'Valor' : 'Val. Func.'}</th>
        </tr>
      </thead>
      <tbody>
        ${printableRows.map((s) => {
          const data = new Date(s.data_hora).toLocaleDateString("pt-BR");
          const localString = [s.andar, s.local].filter(Boolean).join(" - ") || "-";
          return `
            <tr>
              <td class="cell-data">${data}</td>
              <td class="cell-placa">${s.placa}</td>
              <td>${s.tipo_lavagem || "Completo"}</td>
              <td>${localString}</td>
              <td class="cell-equipe">${s.funcionario || "-"}</td>
              <td class="text-right cell-valor">${formatMoney(isCliente ? s.valor : getParteFuncionario(s.valor))}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    ${truncated ? `<p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">Foram omitidos ${lista.length - printableRows.length} registros para otimizar o PDF. Exporte o CSV para ver todos.</p>` : ''}

    <div class="footer">
      <div class="footer-brand">
        <p>Relatório Inteligente gerado por <span>Vexaris</span></p>
      </div>
      <a class="footer-link" href="https://vexaris.com.br" target="_blank">vexaris.com.br</a>
    </div>
  </div>

  <script>
    // Dispara a impressão/download assim que a tela carregar
    setTimeout(() => {
      window.print();
    }, 500);
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    const status = error instanceof ServicosError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erro ao exportar relatorio.";

    return Response.json({ error: message }, { status });
  }
}
