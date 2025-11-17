from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied
from django.utils.timezone import now
from django.utils.dateparse import parse_date
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from datetime import date

from .models import Banco, Boleto, Cidade, Cliente, Conta, Contrato, Empresa, Estado, FormaPagamento
from .serializers import (
    BancoSerializer, BoletoSerializer, CidadeSerializer, ClienteSerializer,
    ConsultaClienteSerializer, ContaSerializer, ContratoSerializer,
    EmpresaSerializer, EstadoSerializer, FormaPagamentoSerializer, UsuarioSerializer
)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]


class EmpresaViewSet(viewsets.ModelViewSet):
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Empresa.objects.filter(usuarios=self.request.user)


class BaseEmpresaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.model.objects.filter(empresa__in=self.request.user.empresas.all())

    def perform_create(self, serializer):
        empresa_id = self.request.data.get('empresa')
        if not self.request.user.empresas.filter(id=empresa_id).exists():
            raise PermissionDenied("Usuário não tem acesso à empresa informada.")
        empresa = self.request.user.empresas.get(id=empresa_id)
        serializer.save(empresa=empresa)


class ClienteViewSet(BaseEmpresaViewSet):
    serializer_class = ClienteSerializer
    model = Cliente
    queryset = Cliente.objects.all()

    def get_queryset(self):
        return Cliente.objects.filter(
            empresa__in=self.request.user.empresas.all(),
            ativo=True
        )

    def destroy(self, request, *args, **kwargs):
        cliente = self.get_object()
        cliente.ativo = False
        cliente.save()
        return Response({'detail': 'Cliente desabilitado com sucesso.'}, status=status.HTTP_200_OK)


class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer
    permission_classes = [permissions.IsAuthenticated]


class CidadeViewSet(viewsets.ModelViewSet):
    queryset = Cidade.objects.all()
    serializer_class = CidadeSerializer
    permission_classes = [permissions.IsAuthenticated]


class FormaPagamentoViewSet(BaseEmpresaViewSet):
    serializer_class = FormaPagamentoSerializer
    model = FormaPagamento
    queryset = FormaPagamento.objects.all()


class ContratoViewSet(BaseEmpresaViewSet):
    serializer_class = ContratoSerializer
    model = Contrato
    queryset = Contrato.objects.all()

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar_contrato(self, request, pk=None):
        contrato = self.get_object()
        forma_pagamento = contrato.forma_pagamento

        if forma_pagamento.situacao == 'cancelado':
            return Response({'detail': 'Este contrato já está cancelado.'}, status=status.HTTP_400_BAD_REQUEST)

        forma_pagamento.situacao = 'cancelado'
        forma_pagamento.data_cancelamento = now().date()
        forma_pagamento.save()

        return Response({'detail': 'Contrato cancelado com sucesso.'}, status=status.HTTP_200_OK)


class ContaViewSet(BaseEmpresaViewSet):
    serializer_class = ContaSerializer
    model = Conta
    queryset = Conta.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['situacao', 'cliente', 'data_vencimento']

    @action(detail=True, methods=['patch'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        conta = self.get_object()
        if conta.situacao == 'cancelado':
            return Response({'detail': 'Esta conta já está cancelada.'}, status=status.HTTP_400_BAD_REQUEST)

        conta.situacao = 'cancelado'
        conta.save()
        return Response({'detail': 'Conta cancelada com sucesso.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='quitar')
    def quitar(self, request, pk=None):
        conta = self.get_object()
        if conta.situacao == 'quitado':
            return Response({'detail': 'Esta conta já está quitada.'}, status=status.HTTP_400_BAD_REQUEST)

        conta.situacao = 'quitado'
        conta.save()
        return Response({'detail': 'Conta quitada com sucesso.'}, status=status.HTTP_200_OK)


class ConsultaContaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cliente_id = request.query_params.get('cliente')
        contrato_id = request.query_params.get('contrato')
        situacao = request.query_params.get('situacao')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        ordering = request.query_params.get('ordering')
        reverse = request.query_params.get('reverse')

        contas = Conta.objects.filter(empresa__in=request.user.empresas.all())

        if cliente_id:
            contas = contas.filter(cliente_id=cliente_id)
        if contrato_id:
            contas = contas.filter(contrato_id=contrato_id)
        if situacao:
            contas = contas.filter(situacao=situacao)
        if data_inicio:
            di = parse_date(data_inicio)
            if di:
                contas = contas.filter(data_vencimento__gte=di)
        if data_fim:
            df = parse_date(data_fim)
            if df:
                contas = contas.filter(data_vencimento__lte=df)
        if ordering:
            contas = contas.order_by(ordering)
            if reverse:
                contas = contas.reverse()

        # ========================
        # CÁLCULO DE JUROS E MULTAS
        # ========================
        hoje = date.today()
        resultados = []

        total_original = 0
        total_juros = 0
        total_multa = 0
        total_cobranca = 0
        total_juridica = 0
        total_corrigido = 0

        for conta in contas:
            valor_original = float(conta.valor)
            valor_juros = 0
            valor_multa = 0
            valor_cobranca = 0
            valor_juridica = 0
            valor_corrigido = valor_original

            if conta.data_vencimento and conta.data_vencimento < hoje:
                dias_atraso = (hoje - conta.data_vencimento).days

                # 1️⃣ Após vencimento → 1% ao mês (proporcional) + multa 2%
                meses_atraso = dias_atraso / 30
                valor_juros = valor_original * 0.01 * meses_atraso
                valor_multa = valor_original * 0.02
                valor_corrigido += valor_juros + valor_multa

                # 2️⃣ Após 5 dias → +10% (assessoria de cobrança)
                if dias_atraso > 5:
                    valor_cobranca = valor_corrigido * 0.10
                    valor_corrigido += valor_cobranca

                # 3️⃣ Após 15 dias → +10% (assessoria jurídica)
                if dias_atraso > 15:
                    valor_juridica = valor_corrigido * 0.10
                    valor_corrigido += valor_juridica

            # Totais acumulados
            total_original += valor_original
            total_juros += valor_juros
            total_multa += valor_multa
            total_cobranca += valor_cobranca
            total_juridica += valor_juridica
            total_corrigido += valor_corrigido

            item = ContaSerializer(conta).data
            item["valor_original"] = round(valor_original, 2)
            item["valor_juros"] = round(valor_juros, 2)
            item["valor_multa"] = round(valor_multa, 2)
            item["valor_assessoria_cobranca"] = round(valor_cobranca, 2)
            item["valor_assessoria_juridica"] = round(valor_juridica, 2)
            item["valor_corrigido"] = round(valor_corrigido, 2)
            item["dias_atraso"] = (hoje - conta.data_vencimento).days if conta.data_vencimento and conta.data_vencimento < hoje else 0

            resultados.append(item)

        return Response({
            "resultados": resultados,
            "totalizador": {
                "valor_total_original": round(total_original, 2),
                "valor_total_juros": round(total_juros, 2),
                "valor_total_multa": round(total_multa, 2),
                "valor_total_assessoria_cobranca": round(total_cobranca, 2),
                "valor_total_assessoria_juridica": round(total_juridica, 2),
                "valor_total_corrigido": round(total_corrigido, 2),
            }
        })


class ConsultaClienteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        cliente_id = request.query_params.get('cliente')
        clientes = Cliente.objects.filter(
            empresa__in=request.user.empresas.all(),
            ativo=True
        )
        
        if cliente_id:
            clientes = clientes.filter(id=cliente_id)

        serializer = ClienteSerializer(clientes, many=True)
        return Response({'resultados': serializer.data})


class BancoViewSet(viewsets.ModelViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer
    permission_classes = [permissions.IsAuthenticated]


class BoletoViewSet(BaseEmpresaViewSet):
    serializer_class = BoletoSerializer
    model = Boleto
    queryset = Boleto.objects.all()


class ConsultaContratoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Contrato.objects.filter(empresa__in=request.user.empresas.all())

        cliente = request.query_params.get('cliente')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        data_vencimento = request.query_params.get('data_vencimento')

        if cliente:
            qs = qs.filter(cliente_id=cliente)
        if data_inicio:
            qs = qs.filter(data_inicio__gte=parse_date(data_inicio))
        if data_fim:
            qs = qs.filter(data_fim__lte=parse_date(data_fim))
        if data_vencimento:
            qs = qs.filter(data_vencimento=data_vencimento)

        serializer = ContratoSerializer(qs, many=True)
        return Response({"resultados": serializer.data})


class ConsultaFormaPagamentoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = FormaPagamento.objects.filter(empresa__in=request.user.empresas.all())

        tipo = request.query_params.get('tipo')
        situacao = request.query_params.get('situacao')
        data_cancelamento = request.query_params.get('data_cancelamento')

        if tipo:
            qs = qs.filter(tipo=tipo)
        if situacao:
            qs = qs.filter(situacao=situacao)
        if data_cancelamento:
            qs = qs.filter(data_cancelamento=parse_date(data_cancelamento))

        serializer = FormaPagamentoSerializer(qs, many=True)
        return Response({"resultados": serializer.data})


class ConsultaBoletoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Boleto.objects.filter(empresa__in=request.user.empresas.all())

        situacao = request.query_params.get('situacao')
        banco = request.query_params.get('banco')
        conta = request.query_params.get('conta')
        documento = request.query_params.get('documento')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        if situacao:
            qs = qs.filter(situacao=situacao)
        if banco:
            qs = qs.filter(banco_id=banco)
        if conta:
            qs = qs.filter(conta_vinculada_id=conta)
        if documento:
            qs = qs.filter(documento=documento)
        if data_inicio:
            qs = qs.filter(data_criacao__gte=parse_date(data_inicio))
        if data_fim:
            qs = qs.filter(data_criacao__lte=parse_date(data_fim))

        serializer = BoletoSerializer(qs, many=True)
        return Response({"resultados": serializer.data})


class ConsultaBancoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Banco.objects.all()

        nome = request.query_params.get('nome')
        codigo = request.query_params.get('codigo_compensacao')

        if nome:
            qs = qs.filter(nome__icontains=nome)
        if codigo:
            qs = qs.filter(codigo_compensacao=codigo)

        serializer = BancoSerializer(qs, many=True)
        return Response({"resultados": serializer.data})


class ConsultaCidadeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Cidade.objects.all()

        nome = request.query_params.get('nome')
        estado_id = request.query_params.get('estado_id')

        if nome:
            qs = qs.filter(nome__icontains=nome)
        if estado_id:
            qs = qs.filter(estado_id=estado_id)

        serializer = CidadeSerializer(qs, many=True)
        return Response({"resultados": serializer.data})


class ConsultaEstadoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Estado.objects.all()

        sigla = request.query_params.get('sigla')
        regiao = request.query_params.get('regiao_sigla')

        if sigla:
            qs = qs.filter(sigla__iexact=sigla)
        if regiao:
            qs = qs.filter(regiao_sigla__iexact=regiao)

        serializer = EstadoSerializer(qs, many=True)
        return Response({"resultados": serializer.data})
