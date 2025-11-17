from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now

class Empresa(models.Model):
    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True)
    usuarios = models.ManyToManyField(User, related_name='empresas')

    def __str__(self):
        return self.nome

class Estado(models.Model):
    ibge_id = models.IntegerField(unique=True)
    nome = models.CharField(max_length=100)
    sigla = models.CharField(max_length=2)
    regiao_nome = models.CharField(max_length=100)
    regiao_sigla = models.CharField(max_length=2)

    def __str__(self):
        return f"{self.nome} ({self.sigla})"
    
class Cidade(models.Model):
    ibge_id = models.IntegerField(unique=True)
    nome = models.CharField(max_length=255)
    microrregiao = models.CharField(max_length=255, blank=True)
    mesorregiao = models.CharField(max_length=255, blank=True)
    estado = models.ForeignKey(Estado, on_delete=models.PROTECT, related_name='cidades')

    def __str__(self):
        return f"{self.nome} - {self.estado.sigla}"


class Cliente(models.Model):
    TIPO_PESSOA = [
        ('F', 'Pessoa Física'),
        ('J', 'Pessoa Jurídica'),
    ]

    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='clientes')
    tipo = models.CharField(max_length=1, choices=TIPO_PESSOA)
    
    nome_completo = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True)
    celular = models.CharField(max_length=20, blank=True)
    endereco = models.CharField(max_length=255)
    numero = models.CharField(max_length=10)
    complemento = models.CharField(max_length=255, blank=True)
    cidade = models.ForeignKey(Cidade, on_delete=models.PROTECT)
    email = models.EmailField()

    cpf = models.CharField(max_length=14, blank=True, null=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)

    razao_social = models.CharField(max_length=255, blank=True, null=True)
    cnpj = models.CharField(max_length=18, blank=True, null=True)

    ativo = models.BooleanField(default=True)
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome_completo


class FormaPagamento(models.Model):
    OPCOES_PAGAMENTO = [
        ('credito', 'Cartão de Crédito'),
        ('debito', 'Cartão de Débito'),
        ('pix', 'Pix'),
        ('dinheiro', 'Dinheiro'),
        ('boleto', 'Boleto'),
    ]

    SITUACOES = [
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
        ('cancelado', 'Cancelado'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='formas_pagamento')
    tipo = models.CharField(max_length=20, choices=OPCOES_PAGAMENTO)
    situacao = models.CharField(max_length=10, choices=SITUACOES, default='ativo')
    data_cancelamento = models.DateField(blank=True, null=True)
    observacao = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if self.situacao == 'cancelado' and self.data_cancelamento is None:
            self.data_cancelamento = now().date()
        elif self.situacao != 'cancelado':
            self.data_cancelamento = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.get_situacao_display()}"


class Contrato(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='contratos')
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    data_vencimento = models.IntegerField()
    data_assinatura = models.DateField()
    mensalidade = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.ForeignKey(FormaPagamento, on_delete=models.CASCADE)
    observacao = models.TextField(blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Contrato de {self.cliente.nome_completo} - {self.data_inicio} até {self.data_fim}"


class Conta(models.Model):
    SITUACOES = [
        ('pendente', 'Pendente'),
        ('quitado', 'Quitado'),
        ('parcelado', 'Parcelado'),
        ('renegociado', 'Renegociado'),
        ('cancelado', 'Cancelado'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='contas')
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    contrato = models.ForeignKey(Contrato, on_delete=models.PROTECT)
    data_vencimento = models.DateField()
    situacao = models.CharField(max_length=15, choices=SITUACOES, default='pendente')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    observacao = models.TextField(blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conta de {self.cliente.nome_completo} - {self.situacao} - R${self.valor}"

class Banco(models.Model):
    nome = models.CharField(max_length=100)
    codigo_compensacao = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return self.nome

class Boleto(models.Model):
    SITUACOES = [
        ('ativa', 'Ativa'),
        ('desativada', 'Desativada'),
        ('pendente', 'Pendente'),
    ]

    TIPO_PESSOA = [
        ('F', 'Pessoa Física'),
        ('J', 'Pessoa Jurídica'),
    ]

    TITULOS = [
        ('cobranca_simples', 'Cobrança Simples'),
        ('cobranca_vinculada', 'Cobrança Vinculada'),
        ('descontada', 'Descontada'),
        ('cobranca_direta', 'Cobrança Direta'),
        ('outros', 'Outros'),
    ]

    PROTESTO = [
        ('nao', 'Não protestar'),
        ('sim', 'Protestar automaticamente'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='boletos')
    descricao = models.CharField(max_length=255)
    situacao = models.CharField(max_length=20, choices=SITUACOES, default='pendente')
    tipo_pessoa = models.CharField(max_length=1, choices=TIPO_PESSOA)
    documento = models.CharField(max_length=18)
    ultima_remessa = models.DateField(blank=True, null=True)

    protesto_automatico = models.CharField(max_length=10, choices=PROTESTO, default='nao')
    dias_protesto = models.PositiveIntegerField(default=0)

    multa_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    juros_dia_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    desconto_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    conta_vinculada = models.ForeignKey(Conta, on_delete=models.PROTECT, related_name='boletos')
    banco = models.ForeignKey(Banco, on_delete=models.PROTECT, related_name='boletos')
    titulo = models.CharField(max_length=30, choices=TITULOS, default='cobranca_simples')

    cedente = models.CharField(max_length=255)
    agencia = models.CharField(max_length=10)
    digito_agencia = models.CharField(max_length=2)
    conta = models.CharField(max_length=20)
    digito_conta = models.CharField(max_length=2)
    prefixo = models.PositiveSmallIntegerField()

    carteira = models.CharField(max_length=10)
    modalidade = models.CharField(max_length=10)
    especie_documento = models.CharField(max_length=50)

    data_criacao = models.DateTimeField(auto_now_add=True)

    codigo_inter = models.CharField("Código Banco Inter", max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.descricao} - {self.banco.nome} - {self.documento}"

class Log(models.Model):
    TIPO_ACAO = [
        ('INSERT', 'Inserção'),
        ('UPDATE', 'Atualização'),
        ('DELETE', 'Remoção'),
    ]

    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='logs')
    tabela_afetada = models.CharField(max_length=50)
    registro_id = models.IntegerField()
    acao = models.CharField(max_length=20, choices=TIPO_ACAO)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    descricao = models.TextField(blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.acao} em {self.tabela_afetada} [{self.registro_id}]"
