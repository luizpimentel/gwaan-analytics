import { useState } from 'react';
import { X, Printer, FileText, ShieldCheck, Layers } from 'lucide-react';
import type {
  Atendimento,
  GuiaDerivadaDaConsulta,
  Paciente,
  ProcedimentoAtendimento,
  Profissional
} from '../data/dadosFaturamento';
import { formatarDataBR, formatarMoeda } from '../utils/formatadores';

interface ModalGuiaTussProps {
  atendimento: Atendimento | GuiaDerivadaDaConsulta;
  paciente?: Paciente | null;
  medico?: Profissional | null;
  loteVinculadoId?: string;
  faturaVinculadaId?: string;
  aoFechar: () => void;
}

function obterProcedimentosAtendimento(
  atendimento: Atendimento | GuiaDerivadaDaConsulta
): ProcedimentoAtendimento[] {
  if (atendimento.procedimentos && atendimento.procedimentos.length > 0) {
    return atendimento.procedimentos;
  }
  return [
    {
      id: `PROC-${atendimento.id}-1`,
      codigoTuss: atendimento.codigoTuss || '10101012',
      descricao: atendimento.descricao,
      valor: atendimento.valor,
      desconto:
        atendimento.operadora === 'Particular' ? atendimento.desconto : undefined,
      senhaAutorizacao: atendimento.senhaAutorizacao,
      numeroGuia: atendimento.numeroGuia,
      numeroGuiaOperadora: atendimento.numeroGuiaOperadora || atendimento.numeroGuia
    }
  ];
}

function gerarBlocoHtmlGuia(
  atendimento: Atendimento | GuiaDerivadaDaConsulta,
  paciente?: Paciente | null,
  medico?: Profissional | null
): { htmlBloco: string; numGuia: string } {
  const procedimentos = obterProcedimentosAtendimento(atendimento);
  const ehParticular = atendimento.operadora === 'Particular';
  const numGuia =
    ('numeroGuiaPK' in atendimento && atendimento.numeroGuiaPK) ||
    atendimento.numeroGuia ||
    (atendimento.id.startsWith('G-')
      ? atendimento.id
      : `G-${atendimento.id.replace(/\D/g, '')}`);

  const numGuiaOperadora = ehParticular
    ? 'Particular (Isento)'
    : ('numeroGuiaOperadora' in atendimento &&
      atendimento.numeroGuiaOperadora?.trim()) ||
    procedimentos[0]?.numeroGuiaOperadora?.trim() ||
    numGuia;

  const codigoConsulta =
    ('consultaIdPK' in atendimento && atendimento.consultaIdPK) ||
    (atendimento.id.startsWith('CONS-')
      ? atendimento.id
      : `CONS-${atendimento.id.replace(/\D/g, '')}`);

  const senhaGuia = ehParticular
    ? undefined
    : atendimento.senhaAutorizacao ||
    procedimentos[0]?.senhaAutorizacao ||
    `AUTH-${atendimento.id.replace(/\D/g, '')}01`;

  const somaDescontosProc = procedimentos.reduce(
    (acc, p) => acc + (Number(p.desconto) || 0),
    0
  );
  const desconto = ehParticular
    ? somaDescontosProc > 0
      ? somaDescontosProc
      : (atendimento.desconto ?? 0)
    : 0;
  const liquido = Math.max(0, atendimento.valor - desconto);
  const crmTexto = medico?.crm
    ? `CRM/${medico.ufCrm || 'SP'} ${medico.crm}`
    : 'CRM/SP 142.890';

  const linhasProcedimentosHtml = procedimentos
    .map((proc, idx) => {
      const descLinha = ehParticular
        ? somaDescontosProc > 0
          ? Number(proc.desconto) || 0
          : idx === 0
            ? desconto
            : 0
        : 0;
      const guiaOpeLinha = ehParticular
        ? '-'
        : proc.numeroGuiaOperadora?.trim() || numGuiaOperadora;

      return `
      <tr>
        <td><strong>${proc.numeroGuia || numGuia}</strong></td>
        <td><strong>${guiaOpeLinha}</strong></td>
        <td><strong>${proc.codigoTuss || '10101012'}</strong></td>
        <td>${proc.descricao}</td>
        ${!ehParticular ? `<td><strong>${proc.senhaAutorizacao || senhaGuia}</strong></td>` : '<td>Atendimento Particular</td>'}
        <td>${formatarMoeda(proc.valor)}</td>
        <td>${formatarMoeda(descLinha)}</td>
        <td><strong>${formatarMoeda(Math.max(0, proc.valor - descLinha))}</strong></td>
      </tr>`;
    })
    .join('');

  const htmlBloco = `
  <div class="guia-page">
    <div class="header-box">
      <div>
        <div class="title">GUIA DE ATENDIMENTO MÉDICO E FATURAMENTO TISS / TUSS</div>
        <div class="subtitle">Gwaan Corporativo • Consulta: ${codigoConsulta} • Paciente: ${atendimento.pacienteId}</div>
      </div>
      <div style="text-align: right;">
        <div class="label">Guia Empresa / Guia Operadora</div>
        <div class="val" style="font-size: 15px;">${numGuia} / ${numGuiaOperadora}</div>
        ${!ehParticular ? `<div class="subtitle"><strong>Senha de Autorização: ${senhaGuia}</strong></div>` : `<div class="subtitle">Modalidade Particular</div>`}
      </div>
    </div>

    <div class="section-title">1. Identificação da Operadora, Guias e Atendimento</div>
    <div class="grid">
      <div class="cell"><span class="label">Operadora / Modalidade</span><span class="val">${atendimento.operadora}${atendimento.plano ? ` (${atendimento.plano})` : ''}</span></div>
      <div class="cell"><span class="label">Código Guia Empresa</span><span class="val">${numGuia}</span></div>
      <div class="cell"><span class="label">Código Guia Operadora</span><span class="val">${numGuiaOperadora}</span></div>
      <div class="cell"><span class="label">${!ehParticular ? 'Senha de Autorização' : 'Data e Horário'}</span><span class="val">${!ehParticular ? senhaGuia : `${formatarDataBR(atendimento.data)} às ${atendimento.hora || '09:00'}`}</span></div>
    </div>

    <div class="section-title">2. Dados do Beneficiário / Paciente</div>
    <div class="grid">
      <div class="cell"><span class="label">Nome do Paciente</span><span class="val">${atendimento.pacienteNome}</span></div>
      <div class="cell"><span class="label">Código do Paciente</span><span class="val">${atendimento.pacienteId}</span></div>
      <div class="cell"><span class="label">Matrícula / Carteirinha</span><span class="val">${atendimento.matricula || paciente?.numeroCarteirinha || '-'}</span></div>
      <div class="cell"><span class="label">Telefone / Contato</span><span class="val">${paciente?.telefone || '-'}</span></div>
    </div>

    <div class="section-title">3. Corpo Clínico Executante</div>
    <div class="grid">
      <div class="cell"><span class="label">Médico Executante</span><span class="val">${atendimento.medicoNome}</span></div>
      <div class="cell"><span class="label">Especialidade</span><span class="val">${atendimento.especialidade}</span></div>
      <div class="cell"><span class="label">Conselho Profissional</span><span class="val">${crmTexto}</span></div>
      <div class="cell"><span class="label">Data do Atendimento</span><span class="val">${formatarDataBR(atendimento.data)} às ${atendimento.hora || '09:00'}</span></div>
    </div>

    <div class="section-title">4. Relação de Procedimentos Realizados (${procedimentos.length} procedimento(s))</div>
    <table>
      <thead>
        <tr>
          <th>Guia Empresa</th>
          <th>Guia Operadora</th>
          <th>Código TUSS</th>
          <th>Descrição do Procedimento</th>
          <th>${!ehParticular ? 'Senha' : 'Modalidade'}</th>
          <th>Valor Bruto</th>
          <th>Desconto</th>
          <th>Valor Líquido</th>
        </tr>
      </thead>
      <tbody>
        ${linhasProcedimentosHtml}
        <tr style="background: #f5f7ed;">
          <td colspan="5"><strong>Total Consolidado da Guia (${numGuia})</strong></td>
          <td><strong>${formatarMoeda(atendimento.valor)}</strong></td>
          <td><strong>${formatarMoeda(desconto)}</strong></td>
          <td><strong>${formatarMoeda(liquido)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-line">Assinatura do Beneficiário / Responsável (${atendimento.pacienteNome})</div>
      <div class="sig-line">Carimbo e Assinatura do Médico Executante (${atendimento.medicoNome} — ${crmTexto})</div>
    </div>
  </div>`;

  return { htmlBloco, numGuia };
}

const ESTILOS_IMPRESSAO_GUIA = `
  * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
  body { color: #1f2920; background: #fff; }
  .guia-page { padding: 28px; page-break-after: always; }
  .guia-page:last-child { page-break-after: auto; }
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
`;

export function imprimirGuiaTussAtendimento(
  atendimento: Atendimento | GuiaDerivadaDaConsulta,
  paciente: Paciente,
  medico: Profissional
) {
  if (!paciente || !medico) return;
  const { htmlBloco, numGuia } = gerarBlocoHtmlGuia(atendimento, paciente, medico);
  const htmlImpressao = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Guia de Atendimento — ${numGuia} (${atendimento.pacienteNome})</title>
  <style>${ESTILOS_IMPRESSAO_GUIA}</style>
</head>
<body>
  ${htmlBloco}
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

export function imprimirTodasGuiasTussAtendimento(
  guias: (Atendimento | GuiaDerivadaDaConsulta)[],
  paciente: Paciente,
  medico: Profissional
) {
  if (!guias || guias.length === 0 || !paciente || !medico) return;

  const blocos = guias.map((g) => gerarBlocoHtmlGuia(g, paciente, medico).htmlBloco);
  const nomePaciente = guias[0]?.pacienteNome || 'Paciente';

  const htmlImpressao = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Guias da Consulta (${guias.length}) — ${nomePaciente}</title>
  <style>${ESTILOS_IMPRESSAO_GUIA}</style>
</head>
<body>
  ${blocos.join('\n')}
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
  loteVinculadoId,
  faturaVinculadaId,
  aoFechar
}: ModalGuiaTussProps) {
  const [abaAtiva, setAbaAtiva] = useState<'identificacao' | 'procedimentos'>(
    'identificacao'
  );

  const procedimentos = obterProcedimentosAtendimento(atendimento);
  const ehParticular = atendimento.operadora === 'Particular';
  const numGuia =
    ('numeroGuiaPK' in atendimento && atendimento.numeroGuiaPK) ||
    atendimento.numeroGuia ||
    (atendimento.id.startsWith('G-')
      ? atendimento.id
      : `G-${atendimento.id.replace(/\D/g, '')}`);

  const numGuiaOperadora = ehParticular
    ? 'Isento (Particular)'
    : ('numeroGuiaOperadora' in atendimento &&
      atendimento.numeroGuiaOperadora?.trim()) ||
    procedimentos[0]?.numeroGuiaOperadora?.trim() ||
    numGuia;

  const codigoConsulta =
    ('consultaIdPK' in atendimento && atendimento.consultaIdPK) ||
    (atendimento.id.startsWith('CONS-')
      ? atendimento.id
      : `CONS-${atendimento.id.replace(/\D/g, '')}`);
  const loteVinculado =
    loteVinculadoId ||
    ('loteVinculadoId' in atendimento ? atendimento.loteVinculadoId : undefined);
  const faturaVinculada =
    faturaVinculadaId ||
    ('faturaVinculadaId' in atendimento ? atendimento.faturaVinculadaId : undefined);

  const senhaGuia = ehParticular
    ? undefined
    : atendimento.senhaAutorizacao ||
    procedimentos[0]?.senhaAutorizacao ||
    `AUTH-${atendimento.id.replace(/\D/g, '')}01`;
  const codigoTussPrincipal =
    procedimentos[0]?.codigoTuss || atendimento.codigoTuss || '10101012';
  const desconto = ehParticular ? (atendimento.desconto ?? 0) : 0;
  const liquido = Math.max(0, atendimento.valor - desconto);
  const crmTexto = medico?.crm
    ? `CRM/${medico.ufCrm || 'SP'} ${medico.crm}`
    : 'CRM/SP 142.890';

  return (
    <div className="modal-overlay" onClick={aoFechar} style={{ zIndex: 1300 }}>
      <div
        className="modal-content modal-content-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="#778873" />
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>
                Detalhamento da Guia de Atendimento — {numGuia}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {ehParticular
                  ? 'Documento de faturamento para modalidade Particular.'
                  : `Documento de faturamento TISS vinculado à operadora ${atendimento.operadora}.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon-square"
            onClick={aoFechar}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="lote-summary-strip">
          <div>
            <span className="strip-label">Código da Consulta</span>
            <strong style={{ color: '#778873' }}>{codigoConsulta}</strong>
          </div>
          <div>
            <span className="strip-label">Guia Empresa</span>
            <strong style={{ color: '#778873' }}>{numGuia}</strong>
          </div>
          <div>
            <span className="strip-label">Guia Operadora</span>
            <strong>{numGuiaOperadora}</strong>
          </div>
          <div>
            <span className="strip-label">Código do Paciente</span>
            <strong>{atendimento.pacienteId}</strong>
          </div>
          <div>
            <span className="strip-label">Nome do Paciente</span>
            <strong>{atendimento.pacienteNome}</strong>
          </div>
          <div>
            <span className="strip-label">Operadora</span>
            <strong>{atendimento.operadora}</strong>
          </div>
          <div>
            <span className="strip-label">Valor Líquido</span>
            <strong style={{ color: 'var(--accent-color)' }}>
              {formatarMoeda(liquido)}
            </strong>
          </div>
        </div>

        <div className="modal-abas">
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'identificacao' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('identificacao')}
          >
            <ShieldCheck size={15} />
            <span>Identificação da Guia e Credenciamento</span>
          </button>
          <button
            type="button"
            className={`modal-aba-btn ${abaAtiva === 'procedimentos' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('procedimentos')}
          >
            <Layers size={15} />
            <span>Procedimentos Vinculados ({procedimentos.length})</span>
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
                PADRÃO TISS / TUSS — GUIA EMPRESA {numGuia} • GUIA OPERADORA{' '}
                {numGuiaOperadora}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}
            >
              {!ehParticular ? (
                <span className="badge badge-faturado">
                  Senha de Autorização: {senhaGuia}
                </span>
              ) : (
                <span className="badge badge-faturar">
                  Atendimento Particular
                </span>
              )}
              {loteVinculado && (
                <span className="badge badge-faturado">Lote: {loteVinculado}</span>
              )}
              {faturaVinculada && (
                <span className="badge badge-enviado">Fatura: {faturaVinculada}</span>
              )}
            </div>
          </div>

          {abaAtiva === 'identificacao' ? (
            <>
              <div className="tuss-grid">
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Código Guia Empresa</span>
                  <span className="tuss-field-value" style={{ color: '#778873' }}>
                    {numGuia}
                  </span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Código Guia Operadora</span>
                  <span className="tuss-field-value" style={{ color: '#778873' }}>
                    {numGuiaOperadora}
                  </span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Código da Consulta</span>
                  <span className="tuss-field-value">{codigoConsulta}</span>
                </div>
                {!ehParticular ? (
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">
                      Senha de Autorização
                    </span>
                    <span
                      className="tuss-field-value"
                      style={{ color: 'var(--accent-color)', fontWeight: 700 }}
                    >
                      {senhaGuia}
                    </span>
                  </div>
                ) : (
                  <div className="tuss-field-box">
                    <span className="tuss-field-label">Modalidade</span>
                    <span className="tuss-field-value">
                      Particular (Cobrança Direta)
                    </span>
                  </div>
                )}
              </div>

              <div className="tuss-grid">
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Nome do Paciente</span>
                  <span className="tuss-field-value">{atendimento.pacienteNome}</span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Código do Paciente</span>
                  <span className="tuss-field-value" style={{ color: '#778873' }}>
                    {atendimento.pacienteId}
                  </span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">CPF do Paciente</span>
                  <span className="tuss-field-value">{paciente?.cpf || '-'}</span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Data e Horário</span>
                  <span className="tuss-field-value">
                    {formatarDataBR(atendimento.data)} às {atendimento.hora || '09:00'}
                  </span>
                </div>
              </div>

              <div className="tuss-grid">
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Médico Executante</span>
                  <span className="tuss-field-value">{atendimento.medicoNome}</span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Especialidade</span>
                  <span className="tuss-field-value">{atendimento.especialidade}</span>
                </div>
                <div className="tuss-field-box">
                  <span className="tuss-field-label">Conselho Profissional</span>
                  <span className="tuss-field-value">{crmTexto}</span>
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
            </>
          ) : (
            <div className="tuss-field-box">
              <span className="tuss-field-label">
                Procedimentos Executados nesta Guia ({numGuia}) —{' '}
                {procedimentos.length} procedimento(s)
              </span>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  marginTop: '0.5rem'
                }}
              >
                {procedimentos.map((proc) => (
                  <div
                    key={proc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <span className="tuss-field-value">
                        [{proc.codigoTuss || '10101012'}] {proc.descricao}
                      </span>
                      <span
                        className="badge badge-faturar"
                        style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}
                      >
                        Guia Ope: {proc.numeroGuiaOperadora || numGuiaOperadora}
                      </span>
                      {!ehParticular ? (
                        <span
                          className="badge badge-faturado"
                          style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}
                        >
                          Senha: {proc.senhaAutorizacao || senhaGuia}
                        </span>
                      ) : null}
                    </div>
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
                    Desconto: <strong>{formatarMoeda(desconto)}</strong>
                  </span>
                )}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--accent-color)'
                  }}
                >
                  Valor Líquido da Guia ({numGuia}): {formatarMoeda(liquido)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={aoFechar}>
            Fechar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => imprimirGuiaTussAtendimento(atendimento, paciente, medico)}
          >
            <Printer size={16} />
            <span>Imprimir Guia</span>
          </button>
        </div>
      </div>
    </div>
  );
}
