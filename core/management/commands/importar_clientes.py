import csv, os
from pathlib import Path
from django.core.management.base import BaseCommand
from core.models import Cliente, Empresa, Cidade
from datetime import datetime

class Command(BaseCommand):
    help = 'Importa clientes a partir de um CSV compatível com o modelo Cliente do Django'

    def handle(self, *args, **kwargs):
        # >>> única mudança importante: caminho relativo ao próprio arquivo (Linux/Windows OK)
        caminho_arquivo = Path(__file__).with_name('clientes_convertidos.csv')

        empresa_id = 1  # ajuste conforme necessário
        cidade_id = 1   # ajuste conforme necessário

        try:
            empresa = Empresa.objects.get(id=empresa_id)
            cidade = Cidade.objects.get(id=cidade_id)
        except (Empresa.DoesNotExist, Cidade.DoesNotExist) as e:
            self.stderr.write(self.style.ERROR(f"Erro: {e}"))
            return

        # abre o CSV (mantendo utf-8; ajuste se precisar)
        with open(caminho_arquivo, newline='', encoding='utf-8') as csvfile:
            leitor = csv.DictReader(csvfile)
            count = 0
            for row in leitor:
                try:
                    cliente = Cliente(
                        empresa=empresa,
                        tipo='F' if 'físic' in (row['CLITIPOPESSOA'] or '').lower() else 'J',
                        nome_completo=row['CLINOME'].strip() if row['CLINOME'] else 'Cliente sem nome',
                        telefone=row.get('CLINROFONECOMERCIAL', '') or '',
                        celular=row.get('CLINROFONECELULAR', '') or '',
                        endereco=row.get('CLIENDERECO', '') or 'Endereço não informado',
                        numero=str(row.get('CLINROEND') or 'S/N'),
                        complemento=row.get('CLICOMPLEMENTOEND', '') or '',
                        cidade=cidade,
                        email=row.get('CLIEMAIL', '') or f'cliente{count}@sememail.com',
                        cpf=row.get('CLICPFCGC') or None,
                        rg=row.get('CLIRGIE') or None,
                        sexo=self.normalizar_sexo(row.get('CLISEXO')),
                        data_nascimento=self.parse_data(row.get('CLIDATANASCIMENTO'))
                    )
                    cliente.save()
                    count += 1
                except Exception as erro:
                    self.stderr.write(self.style.ERROR(f"Erro ao importar linha {count+1}: {erro}"))

            self.stdout.write(self.style.SUCCESS(f"{count} clientes importados com sucesso."))

    def normalizar_sexo(self, valor):
        if not valor:
            return None
        valor = valor.strip().lower()
        if 'masc' in valor:
            return 'M'
        elif 'fem' in valor:
            return 'F'
        return None

    def parse_data(self, valor):
        if not valor:
            return None
        try:
            return datetime.strptime(valor.strip(), '%Y-%m-%d %H:%M:%S')
        except Exception:
            return None

