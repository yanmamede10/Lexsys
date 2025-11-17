import requests
from django.core.management.base import BaseCommand
from core.models import Cidade, Estado

class Command(BaseCommand):
    help = 'Popula o banco com municípios e estados do IBGE'

    def handle(self, *args, **kwargs):
        url = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios'
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        municipios = response.json()
        total_cidades = 0
        total_estados = 0

        for m in municipios:
            microrregiao = m.get('microrregiao')
            if not microrregiao:
                continue

            mesorregiao = microrregiao.get('mesorregiao')
            if not mesorregiao:
                continue

            uf_data = mesorregiao.get('UF')
            if not uf_data:
                continue

            regiao = uf_data.get('regiao')
            if not regiao:
                continue

            estado, created = Estado.objects.get_or_create(
                ibge_id=uf_data['id'],
                defaults={
                    'nome': uf_data['nome'],
                    'sigla': uf_data['sigla'],
                    'regiao_nome': regiao['nome'],
                    'regiao_sigla': regiao['sigla'],
                }
            )

            if created:
                total_estados += 1

            cidade, created = Cidade.objects.update_or_create(
                ibge_id=m['id'],
                defaults={
                    'nome': m['nome'],
                    'microrregiao': microrregiao['nome'],
                    'mesorregiao': mesorregiao['nome'],
                    'estado': estado
                }
            )
            if created:
                total_cidades += 1

        self.stdout.write(self.style.SUCCESS(f'{total_estados} estados criados.'))
        self.stdout.write(self.style.SUCCESS(f'{total_cidades} cidades criadas.'))
