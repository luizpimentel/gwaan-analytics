import { X, Printer, FileText, ShieldCheck } from 'lucide-react';
import type { Atendimento, Paciente, ProcedimentoAtendimento, Profissional } from '../data/dadosFaturamento';
import { formatarDataBR, formatarMoeda } from '../utils/formatadores';

interface ModalGuiaTussProps {
  atendimento: Atendimento;
  paciente?: Paciente | null;
  medico?: Profissional | null;
  aoFechar: () => void;
}

function obterProcedimentosAtendimento(atendimento: Atendimento): ProcedimentoAtendimento[] {
  if (atendimento.procedimentos && atendimento.procedimentos.length > 0) {
    return atendimento.procedimentos;
  }
  return [
    {
      id: `PROC-${atendimento.id}-1`,
      codigoTuss: atendimento.codigoTuss || '10101012',
      descricao: atendimento.descricao,
      valor: atendimento.valor
    }
  ];
}

export function imprimirGuiaTussAtendimento(
  atendimento: Atendimento,
  paciente?: Paciente | null,
  medico?: Profissional | null
) {
  const procedimentos = obterProcedimentosAtendimento(atendimento);
  const desconto = atendimento.operadora === 'Particular' ? (atendimento.desconto ?? 0) : 0;
  const liquido = Math.max(0, atendimento.valor - desconto);
  const crmTexto = medico?.crm
    ? `CRM/${medico.ufCrm || 'SP'} ${medico.crm}`
    : 'CRM/SP 142.890';

  const linhasProcedimentosHtml = procedimentos
    .map(
      (proc, idx) => `
      <tr>
        <td>22 - TUSS</td>
        <td><strong>${proc.codigoTuss || '10101012'}</strong></td>
        <td>${proc.descricao}</td>
        <td>1</td>
        <td>${formatarMoeda(proc.valor)}</td>
        <td>${idx === 0 ? formatarMoeda(desconto) : formatarMoeda(0)}</td>
        <td><strong>${formatarMoeda(Math.max(0, proc.valor - (idx === 0 ? desconto : 0)))}</strong></td>
      </tr>`
    )
    .join('');

  const htmlImpressao = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Guia TUSS — ${atendimento.id} (${atendimento.pacienteNome})</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    body { padding: 28px; color: #1f2920; background: #fff; }
    .header-box { border: 2px solid #4d5e4a; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #f5f7ed; }
    .title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #2c352b; }
    .subtitle { font-size: 12px; color: #5a6b57; margin-top: 4px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e5ecd0; padding: 6px 10px; border: 1px solid #b8c9a9; border-bottom: none; margin-top: 14px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #b8c9a9; }
    .cell { padding: 8px 10px; border-right: 1px solid #b8c9a9; border-bottom: 1px solid #b8c9a9; }
    .cell:last-child { border-right: none; }
    .label { font-size: 9px; text-transform: uppercase; color: #5a6b57; display: block; margin-bottom: 3px; font-weight: 700; }
    .val { font-size: 12px; font-weight: 600; color: #1f2920; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #b8c9a9; }
    th, td { border: 1px solid #b8c9a9; padding: 8px 10px; text-align: left; font-size: 12px; }
    th { background: #f1f3e0; font-size: 10px; text-transform: uppercase; color: #5a6b57; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 42px; padding-top: 24px; }
    .sig-line { border-top: 1px solid #2c352b; text-align: center; padding-top: 6px; font-size: 11px; color: #5a6b57; }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="title">GUIA DE SERVIÇO PROFISSIONAL / SP-SADT — PADRÃO TISS / TUSS</div>
      <div class="subtitle">Gwaan Analytics — Gestão Clínica e Faturamento Hospitalar</div>
    </div>
    <div style="text-align: right;">
      <div class="label">Nº Guia Prestador</div>
      <div class="val" style="font-size: 15px;">GUIA-${atendimento.id}</div>
      <div class="subtitle">Status: ${atendimento.status}</div>
    </div>
  </div>

  <div class="section-title">1. Dados da Operadora e Atendimento</div>
  <div class="grid">
    <div class="cell"><span class="label">Operadora / Origem</span><span class="val">${atendimento.operadora}</span></div>
    <div class="cell"><span class="label">Código Atendimento</span><span class="val">${atendimento.id}</span></div>
    <div class="cell"><span class="label">Data do Atendimento</span><span class="val">${formatarDataBR(atendimento.data)}</span></div>
    <div class="cell"><span class="label">Horário</span><span class="val">${atendimento.hora || '09:00'}</span></div>
  </div>

  <div class="section-title">2. Dados do Beneficiário / Paciente</div>
  <div class="grid">
    <div class="cell"><span class="label">Nome Completo</span><span class="val">${atendimento.pacienteNome}</span></div>
    <div class="cell"><span class="label">ID do Paciente</span><span class="val">${atendimento.pacienteId}</span></div>
    <div class="cell"><span class="label">CPF</span><span class="val">${paciente?.cpf || '-'}</span></div>
    <div class="cell"><span class="label">Telefone / Contato</span><span class="val">${paciente?.telefone || '-'}</span></div>
  </div>

  <div class="section-title">3. Dados do Profissional Executante</div>
  <div class="grid">
    <div class="cell"><span class="label">Médico Responsável</span><span class="val">${atendimento.medicoNome}</span></div>
    <div class="cell"><span class="label">Especialidade</span><span class="val">${atendimento.especialidade}</span></div>
    <div class="cell"><span class="label">Conselho Profissional</span><span class="val">${crmTexto}</span></div>
    <div class="cell"><span class="label">ID do Profissional</span><span class="val">${atendimento.medicoId}</span></div>
  </div>

  <div class="section-title">4. Procedimentos e Exames Realizados (Tabela TUSS)</div>
  <table>
    <thead>
      <tr>
        <th>Tabela</th>
        <th>Código TUSS</th>
        <th>Descrição do Procedimento / Exame</th>
        <th>Qtd.</th>
        <th>Valor Bruto</th>
        <th>Desconto</th>
        <th>Valor Líquido</th>
      </tr>
    </thead>
    <tbody>
      ${linhasProcedimentosHtml}
      <tr style="background: #f5f7ed;">
        <td colspan="4"><strong>Total Consolidado da Guia</strong></td>
        <td><strong>${formatarMoeda(atendimento.valor)}</strong></td>
        <td><strong>${formatarMoeda(desconto)}</strong></td>
        <td><strong>${formatarMoeda(liquido)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-line">Assinatura do Beneficiário / Paciente (${atendimento.pacienteNome})</div>
    <div class="sig-line">Carimbo e Assinatura do Profissional (${atendimento.medicoNome} — ${crmTexto})</div>
  </div>
</body>
</html>`;

  const janela = window.open('', '_blank', 'width=920,height=720');
  if (!janela) {
    window.print();
    return;
  }
  janela.document.open();
  janela.document.write(htmlImpressao);
  janela.document.close();
  janela.focus();
  setTimeout(() => {
    janela.print();
  }, 250);
}

export function ModalGuiaTuss({
  atendimento,
  paciente,
  medico,
  aoFechar
}: ModalGuiaTussProps) {
  const procedimentos = obterProcedimentosAtendimento(atendimento);
  const codigoTussPrincipal = procedimentos[0]?.codigoTuss || atendimento.codigoTuss || '10101012';
  const desconto =
    atendimento.operadora === 'Particular' ? (atendimento.desconto ?? 0) : 0;
  const liquido = Math.max(0, atendimento.valor - desconto);
  const crmTexto = medico?.crm
    ? `CRM/${medico.ufCrm || 'SP'} ${medico.crm}`
    : 'CRM/SP 142.890';

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div
        className="modal-content modal-content-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="#778873" />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>
                Guia TUSS / TISS de Atendimento — GUIA-{atendimento.id}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Documento oficial de faturamento e comprovação de procedimento clínico (
                {atendimento.status})
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-realtime"
            onClick={aoFechar}
            style={{ padding: '0.3rem 0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="tuss-sheet">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#778873" />
              <strong>
                PADRÃO TISS / TABELA TUSS — GUIA DE CONSULTA E SP/SADT
              </strong>
            </div>
            <span className="badge badge-enviado">
              Status do Atendimento: {atendimento.status}
            </span>
          </div>

          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Nº Guia Prestador</span>
              <span className="tuss-field-value" style={{ color: '#778873' }}>
                GUIA-{atendimento.id}
              </span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Operadora / Convênio</span>
              <span className="tuss-field-value">{atendimento.operadora}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Data e Hora</span>
              <span className="tuss-field-value">
                {formatarDataBR(atendimento.data)} às {atendimento.hora || '09:00'}
              </span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Código TUSS Principal</span>
              <span
                className="tuss-field-value"
                style={{ fontFamily: 'monospace' }}
              >
                {codigoTussPrincipal}
              </span>
            </div>
          </div>

          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Beneficiário / Paciente</span>
              <span className="tuss-field-value">{atendimento.pacienteNome}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">ID do Paciente</span>
              <span className="tuss-field-value">{atendimento.pacienteId}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">CPF do Paciente</span>
              <span className="tuss-field-value">{paciente?.cpf || '-'}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Telefone</span>
              <span className="tuss-field-value">{paciente?.telefone || '-'}</span>
            </div>
          </div>

          <div className="tuss-grid">
            <div className="tuss-field-box">
              <span className="tuss-field-label">Profissional Executante</span>
              <span className="tuss-field-value">{atendimento.medicoNome}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Especialidade</span>
              <span className="tuss-field-value">{atendimento.especialidade}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">Conselho / CRM</span>
              <span className="tuss-field-value">{crmTexto}</span>
            </div>
            <div className="tuss-field-box">
              <span className="tuss-field-label">ID do Profissional</span>
              <span className="tuss-field-value">{atendimento.medicoId}</span>
            </div>
          </div>

          <div className="tuss-field-box">
            <span className="tuss-field-label">
              Procedimentos e Exames Realizados (Tabela 22 - TUSS) — {procedimentos.length} item(ns)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
              {procedimentos.map((proc) => (
                <div
                  key={proc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span className="tuss-field-value">
                    [{proc.codigoTuss || '10101012'}] {proc.descricao}
                  </span>
                  <strong>{formatarMoeda(proc.valor)}</strong>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginTop: '0.75rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Valor Bruto: <strong>{formatarMoeda(atendimento.valor)}</strong>
              </span>
              {desconto > 0 && (
                <span style={{ fontSize: '0.85rem', color: '#d97706' }}>
                  Desc: <strong>{formatarMoeda(desconto)}</strong>
                </span>
              )}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--accent-color)'
                }}
              >
                Total Guia: {formatarMoeda(liquido)}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-realtime" onClick={aoFechar}>
            Fechar Visualização
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => imprimirGuiaTussAtendimento(atendimento, paciente, medico)}
          >
            <Printer size={16} />
            <span>Imprimir Guia TUSS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
