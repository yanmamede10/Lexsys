type FK = number;
type PK = number;

type Date = string;
type DateTime = string;

type Empresa = {
    id: PK,
    nome: string,
    cnpj: string,
    usuarios: Array<FK>
}

type Estado = {
    id: PK,
    ibge_id: number,
    nome: string,
    sigla: string,
    regiao_nome: string,
    regiao_sigla: string
}

type Cidade = {
    id: PK,
    ibge_id: number,
    nome: string,
    microrregiao: string,
    mesoregiao: string,
    estado: FK
}

type ClienteBase = {
    id: PK,
    empresa: FK,
    tipo: 'F'|'J',
    nome_completo: string,
    telefone: string,
    celular: string,
    endereco: string,
    numero: string,
    complemento: string,
    cidade: FK,
    email: string,
    ativo: boolean,
    data_criacao: Date,
    data_atualizacao: Date
}

type ClienteFisico = ClienteBase & {
    cpf: string,
    rg: string,
    sexo: 'M'|'F',
    data_nascimento: Date
}

type ClienteJuridico = ClienteBase & {
    razao_social: string,
    cnpj: string
}

type FormaPagamento = {
    id: PK,
    empresa: FK,
    tipo: 'credito'|'debito'|'pix'|'dinheiro'|'boleto',
    situacao: 'ativo'|'inativo'|'cancelado',
    data_cancelamento?: Date,
    observacao: string
}

type Contrato = {
    id: PK,
    empresa: FK,
    cliente: FK,
    data_inicio: Date,
    data_fim: Date,
    data_vencimento: number,
    data_assinatura: Date,
    mensalidade: number,
    forma_pagamento: FK,
    observacao: string,
    data_criacao: Date
}

type Conta = {
    id: PK,
    empresa: FK,
    cliente: FK,
    contrato: FK,
    data_vencimento: Date,
    situacao: 'pendente'|'quitado'|'parcelado'|'renegociado'|'cancelado',
    valor: number,
    observacao: string,
    data_criacao: Date,
    data_atualizacao: Date
}

type Banco = {
    id: PK,
    nome: string,
    codigo_compensacao: string
}

type Boleto = {
    id: PK,
    empresa: FK,
    descricao: string,
    situacao: 'ativa'|'desativada'|'pendente',
    tipo_pessoa: 'F'|'J',
    documento: string,
    ultima_remessa: Date,
    protesto_automatico: 'nao'|'sim'
    dias_protesto: number,
    multa_percentual: number,
    juros_dia_percentual: number,
    desconto_percentual: number,
    conta_vinculada: FK,
    banco: FK,
    titulo: string,
    cedente: string,
    agencia: string,
    digito_agencia: string,
    conta: string,
    digito_conta: string,
    prefixo: number
    carteira: string,
    modalidade: string
    especie_documento: string,
    data_criacao: Date
}

type Log = {
    id: PK,
    empresa: FK,
    tabela_afetada: string,
    registro_id: number,
    acao: 'INSERT'|'UPDATE'|'DELETE',
    usuario: FK,
    descricao: string,
    data_hora: DateTime
}

type Cliente = ClienteFisico|ClienteJuridico;

export type { FK, PK, Cliente, ClienteFisico, ClienteJuridico, Empresa, Estado, Cidade, FormaPagamento, Contrato, Conta, Boleto, Log, Banco }