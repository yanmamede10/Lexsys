from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BancoViewSet,
    BoletoViewSet,
    ClienteViewSet,
    ConsultaContaView,
    ConsultaClienteView,
    ContaViewSet,
    EstadoViewSet,
    UsuarioViewSet,
    CidadeViewSet,
    ContratoViewSet,
    FormaPagamentoViewSet,
    EmpresaViewSet,
    ConsultaContratoView,
    ConsultaFormaPagamentoView,
    ConsultaBoletoView,
    ConsultaBancoView,
    ConsultaCidadeView,
    ConsultaEstadoView,
)

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet, basename='empresa')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'estados', EstadoViewSet, basename='estado')
router.register(r'cidades', CidadeViewSet, basename='cidade')
router.register(r'contratos', ContratoViewSet, basename='contrato')
router.register(r'formas-pagamento', FormaPagamentoViewSet, basename='forma-pagamento')
router.register(r'contas', ContaViewSet, basename='conta')
router.register(r'bancos', BancoViewSet, basename='banco')
router.register(r'boletos', BoletoViewSet, basename='boleto')

urlpatterns = [
    path('', include(router.urls)),
    path('consultas/contas/', ConsultaContaView.as_view(), name='consulta/conta'),
    path('consultas/clientes/', ConsultaClienteView.as_view(), name='consulta/cliente'),
    path('consultas/contratos/', ConsultaContratoView.as_view(), name='consulta/contrato'),
    path('consultas/formas-pagamento/', ConsultaFormaPagamentoView.as_view(), name='consulta/forma_pagamento'),
    path('consultas/boletos/', ConsultaBoletoView.as_view(), name='consulta/boleto'),
    path('consultas/bancos/', ConsultaBancoView.as_view(), name='consulta/banco'),
    path('consultas/cidades/', ConsultaCidadeView.as_view(), name='consulta/cidade'),
    path('consultas/estados/', ConsultaEstadoView.as_view(), name='consulta/estado'),
]
