# 📊 Gwaan Analytics — Monitoramento de Faturamento Hospitalar

![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-3.10-22B5BF?style=for-the-badge)
![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-1.67-F56565?style=for-the-badge)

**Gwaan Analytics** é um dashboard executivo e operacional voltado ao **monitoramento de faturamento médico-hospitalar, controle de guias/lotes (SADT, Internação, Oncologia), gestão de auditoria e retenção de glosas** junto a operadoras de saúde e convênios.

O projeto foi desenvolvido com foco em **usabilidade analítica, visualização de dados em tempo real e persistência local resiliente**, simulando o fluxo financeiro de uma central de faturamento de saúde.

---

## ✨ Principais Funcionalidades

- **📈 KPIs Financeiros em Tempo Real**
  - Cálculo instantâneo de **Receita Faturada**, **Valores em Auditoria/Pendentes**, **Valor Glosado/Retido** e **Volume Total Processado**.
- **📊 Gráficos Analíticos Interativos (`Recharts`)**
  - **Distribuição Financeira por Status**: Gráfico de rosca (*Donut Chart*) detalhando a proporção de valores entre `Faturar`, `Faturado`, `Auditoria`, `Pendencia` e `Glosado`.
  - **Volume por Convênio vs. Meta**: Gráfico de barras comparando o volume acumulado de cada operadora/cliente com uma linha de referência (`ReferenceLine`) da **Meta Financeira** configurável.
- **⚡ Simulador de Stream em Tempo Real ("Live Mode")**
  - Motor de simulação ativável com um clique que gera novas guias e lotes aleatórios a cada **6 segundos**, permitindo testar e demonstrar a reatividade dos gráficos e indicadores em tempo real.
- **🗂️ Gestão Completa de Guias, Lotes e Operadoras**
  - Cadastro manual de lotes/guias com validação de operadora, valor financeiro, status inicial e nível de prioridade (`Alta`, `Média`, `Baixa`).
  - Ações rápidas na fila de processamento (**Faturar**, **Auditar** pendências e **Excluir** registros) com carimbo de horário da última atualização.
  - Painel de configurações para cadastrar/remover **Convênios e Operadoras** e ajustar a **Meta Financeira** global.
- **🔍 Filtros Combinados e Exportação para Excel (CSV)**
  - Busca textual instantânea por código (`FAT-XXXX`), operadora ou descrição do lote, combinada com filtros de **Status** e **Prioridade**.
  - Exportação da visão filtrada para arquivo `.csv` formatado para o padrão brasileiro (codificação **UTF-8 com BOM**, delimitador `;` e casas decimais com vírgula).
- **💾 Persistência Automática (`localStorage`)**
  - Todas as demandas, convênios cadastrados e metas são sincronizados automaticamente no navegador, com opção de **Restaurar Padrão** a qualquer momento.

---

## 🏗️ Arquitetura e Fluxo de Dados

```mermaid
flowchart LR
    subgraph Entrada ["Entrada de Dados"]
        M["Cadastro Manual (Modal)"]
        S["Simulador Tempo Real (6s)"]
        C["Configurações (Metas e Convênios)"]
    end

    subgraph Estado ["Gerenciamento de Estado (React 19)"]
        ST["Estado Reativo (App.tsx)"]
        LS[("localStorage\n(Persistência JSON)")]
        ST <--> LS
    end

    subgraph Saida ["Visualização & Exportação"]
        KPI["Cards de KPIs Financeiros"]
        CH["Gráficos Recharts (Donut & Bar)"]
        TB["Fila de Lotes + Filtros Combinados"]
        CSV["Exportação CSV (Padrão PT-BR)"]
    end

    M --> ST
    S --> ST
    C --> ST
    ST --> KPI
    ST --> CH
    ST --> TB
    TB --> CSV
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade no Projeto |
| :--- | :---: | :--- |
| **React** | `^19.3.1` | Construção da interface reativa e gerenciamento de estado com Hooks (`useState`, `useEffect`). |
| **TypeScript** | `~7.0.2` | Tipagem estática de entidades financeiras (`DemandaFinanceira`, `StatusFaturamento`, `PrioridadeDemanda`). |
| **Vite** | `^8.3.5` | Bundler de alta performance e servidor de desenvolvimento com HMR. |
| **Recharts** | `^3.10.1` | Renderização de gráficos responsivos (`PieChart`, `BarChart`, `ReferenceLine`, `Tooltip`). |
| **Lucide React** | `^1.67.0` | Biblioteca de ícones vetoriais leves para indicadores de status, navegação e ações. |
| **Oxlint** | `^1.89.0` | Linter ultrarrápido para verificação estática de boas práticas em React e TypeScript. |
| **CSS3 Custom Properties** | — | Estilização autoral com paleta orgânica *Sage & Olive* (`#F1F3E0`, `#D2DCB6`, `#A1BC98`, `#778873`), layout responsivo em CSS Grid/Flexbox e modais com *backdrop-filter*. |

---

## 📂 Estrutura do Projeto

```text
gwaan-analytics/
├── public/
│   ├── imagens/
│   │   └── profile.jpg          # Avatar do perfil exibido no cabeçalho
│   └── favicon.svg              # Ícone da aplicação
├── src/
│   ├── data/
│   │   └── dadosFaturamento.ts  # Contratos TypeScript (Interfaces/Types) e constantes iniciais
│   ├── App.tsx                  # Componente principal: lógica de negócio, KPIs, gráficos, tabela e modais
│   ├── index.css                # Design System (variáveis CSS, grid responsivo, badges e modais)
│   └── main.tsx                 # Ponto de entrada da aplicação React
├── .oxlintrc.json               # Configuração de regras de lint (Oxlint)
├── index.html                   # Template HTML principal (PT-BR)
├── package.json                 # Dependências e scripts NPM
├── tsconfig.json                # Configurações do compilador TypeScript
└── vite.config.ts               # Configuração do Vite
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 20+ recomendada)
- **npm** (ou gerenciador compatível)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/luizpimentel/gwaan-analytics.git
   cd gwaan-analytics
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador o endereço exibido no terminal (por padrão `http://localhost:5173`).

4. **Scripts adicionais disponíveis:**
   ```bash
   npm run lint      # Executa a análise estática de código com Oxlint
   npm run build     # Compila o TypeScript e gera o bundle otimizado de produção na pasta dist/
   npm run preview   # Visualiza localmente a versão compilada de produção
   ```

---

## 👨‍💻 Autor

Desenvolvido por **Luiz Felipe** — Analista de Sistemas.

- 💼 **LinkedIn**: [linkedin.com/in/luiz-felipe-de-almeida-pimentel](https://www.linkedin.com/in/luiz-felipe-de-almeida-pimentel/)
- 🔗 **Repositório**: [github.com/luizpimentel/gwaan-analytics](https://github.com/luizpimentel/gwaan-analytics)
