import csv
import os
from django.core.management.base import BaseCommand
from core.models import Cliente, Empresa, FormaPagamento, Contrato, Conta, Cidade
from datetime import datetime
from decimal import Decimal


class Command(BaseCommand):
    help = 'Importa contratos e contas do arquivo solicitacoes_convertido.csv com validação de CPF'

    def handle(self, *args, **kwargs):
        caminho_arquivo = os.path.join(os.path.dirname(__file__), 'solicitacoes_convertido.csv')

        if not os.path.exists(caminho_arquivo):
            self.stdout.write(self.style.ERROR(f'Arquivo não encontrado: {caminho_arquivo}'))
            return

        try:
            empresa = Empresa.objects.get(id=1)
        except Empresa.DoesNotExist:
            self.stdout.write(self.style.ERROR('Empresa com ID 1 não encontrada.'))
            return

        try:
            cidade_padrao = Cidade.objects.get(id=1)  # Ajuste conforme necessário
        except Cidade.DoesNotExist:
            self.stdout.write(self.style.ERROR('Cidade padrão com ID 1 não encontrada.'))
            return

        contratos = {}
        contratos_criados = 0
        contas_criadas = 0
        clientes_criados = 0
        erros = 0

        with open(caminho_arquivo, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                recnro = row.get("recnro", "").strip()
                cpf_raw = row.get("clicpfcgc", "").strip()
                cpf = ''.join(filter(str.isdigit, cpf_raw))

                if not cpf or len(cpf) != 11:
                    self.stdout.write(self.style.WARNING(f'CPF inválido: {cpf_raw} (raw). Pulando linha.'))
                    erros += 1
                    continue

                try:
                    cliente = Cliente.objects.get(cpf=cpf)
                except Cliente.DoesNotExist:
                    # Criar cliente se não existir
                    nome = row.get("clinome", "").strip() or "Cliente sem nome"
                    sexo = row.get("clisexo", "").strip().upper() or None
                    complemento = row.get("clicivil", "").strip() or ""

                    cliente = Cliente.objects.create(
                        empresa=empresa,
                        tipo='F',
                        nome_completo=nome,
                        telefone="",
                        celular="",
                        endereco=row.get("cliendereco", "").strip() or "Endereço não informado",
                        numero=row.get("clinroend", "").strip() or "0",
                        complemento=complemento,
                        cidade=cidade_padrao,
                        email=f"cliente_{cpf}@exemplo.com",
                        cpf=cpf,
                        rg=None,
                        sexo=sexo if sexo in ['M', 'F'] else None,
                        data_nascimento=None,
                        razao_social=None,
                        cnpj=None
                    )
                    clientes_criados += 1

                # Criar ou buscar forma de pagamento
                forma_pgto_desc = row.get("planpagdescricao", "").strip() or "dinheiro"
                forma_pagamento, _ = FormaPagamento.objects.get_or_create(
                    empresa=empresa,
                    tipo='dinheiro',
                    defaults={'situacao': 'ativo'}
                )

                # Criar contrato se ainda não estiver criado
                if recnro not in contratos:
                    data_vencimento = row.get("recpardtvencimento", "").strip()
                    try:
                        data_venc = datetime.strptime(data_vencimento, "%Y-%m-%d").date()
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f'Data inválida no contrato CPF {cpf_raw}. Pulando.'))
                        erros += 1
                        continue

                    contrato = Contrato.objects.create(
                        empresa=empresa,
                        cliente=cliente,
                        data_inicio=data_venc,
                        data_fim=data_venc,
                        data_vencimento=25,
                        data_assinatura=data_venc,
                        mensalidade=Decimal(row.get("recparvlrlancado", "0") or "0"),
                        forma_pagamento=forma_pagamento,
                        observacao="Importado automaticamente"
                    )
                    contratos[recnro] = contrato
                    contratos_criados += 1
                else:
                    contrato = contratos[recnro]

                # Criar conta
                try:
                    vencimento = datetime.strptime(row.get("recpardtvencimento"), "%Y-%m-%d").date()
                except ValueError:
                    self.stdout.write(self.style.WARNING(f'Data inválida na conta CPF {cpf_raw}.'))
                    erros += 1
                    continue

                Conta.objects.create(
                    empresa=empresa,
                    cliente=cliente,
                    contrato=contrato,
                    data_vencimento=vencimento,
                    situacao="pendente",
                    valor=Decimal(row.get("recparvlrlancado", "0") or "0"),
                    observacao=f"Origem: recparseq={row.get('recparseq', '')}"
                )
                contas_criadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'{clientes_criados} clientes, {contratos_criados} contratos e {contas_criadas} contas importadas com sucesso. {erros} erros.'
        ))
