from django.contrib import admin, messages
from django.shortcuts import render
from django.urls import path
from django.utils.timezone import now
from django.db.models import Sum
from django.utils.formats import number_format
from django.utils.html import format_html
from django.template.loader import render_to_string
from django.http import HttpResponse, HttpResponseRedirect
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io
from .integrations.boleto_inter import Boleto as BancoInterBoleto
from .integrations.pdf_utils import PDF
import base64
from .models import Banco, Boleto, Cliente, Cidade, Conta, Empresa, Estado, Contrato, FormaPagamento


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cnpj')
    search_fields = ('nome', 'cnpj')
    filter_horizontal = ('usuarios',)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome_completo', 'tipo', 'empresa', 'email', 'ativo')
    list_filter = ('empresa', 'tipo', 'ativo')
    search_fields = ('nome_completo', 'email', 'cpf', 'cnpj')
    fields = (
        'empresa', 'tipo', 'nome_completo', 'telefone', 'celular',
        'email', 'endereco', 'numero', 'complemento', 'cidade',
        'cpf', 'rg', 'sexo', 'data_nascimento',
        'razao_social', 'cnpj', 'ativo'
    )


@admin.register(Conta)
class ContaAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'contrato', 'data_vencimento', 'situacao', 'valor', 'data_criacao')
    list_filter = ('situacao', 'data_vencimento', 'cliente')
    search_fields = ('cliente__nome_completo',)
    ordering = ('-data_vencimento',)
    change_list_template = "admin/conta/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('relatorio/', self.admin_site.admin_view(self.gerar_relatorio_pdf), name='conta_relatorio_pdf'),
        ]
        return custom_urls + urls

    def gerar_relatorio_pdf(self, request):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            leftMargin=15 * mm,
            rightMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]
        normal.fontSize = 8
        normal.leading = 10
        normal.wordWrap = "CJK"
        bold = ParagraphStyle('Bold', parent=normal, fontName='Helvetica-Bold', fontSize=8)

        story = []
        story.append(Paragraph("<b>Relatório Financeiro</b>", styles["Title"]))
        story.append(Paragraph(f"Gerado em: {now().strftime('%d/%m/%Y %H:%M')}", normal))
        story.append(Spacer(1, 10))

        clientes = Cliente.objects.all().order_by('nome_completo')
        hoje = now().date()

        for index, cliente in enumerate(clientes):
            contas = cliente.conta_set.all().order_by('data_vencimento')
            if not contas.exists():
                continue

            story.append(Paragraph(f"<b>{cliente.nome_completo}</b>", styles["Heading2"]))
            story.append(Paragraph(f"{cliente.endereco}, {cliente.numero} - {cliente.cidade}", normal))
            story.append(Paragraph(
                f"Tel: {cliente.telefone or '-'} | Cel: {cliente.celular or '-'} | Email: {cliente.email or '-'}",
                normal
            ))
            story.append(Spacer(1, 5))

            data = [[
                "Contrato / Conta", "Vencimento", "Valor (R$)", "Juros (R$)", "Multa (R$)",
                "Cobrança (R$)", "Jurídica (R$)", "Total Corrigido (R$)", "Situação"
            ]]

            total_original = total_juros = total_multa = total_cobranca = total_juridica = total_corrigido = 0

            for conta in contas:
                valor_original = float(conta.valor)
                valor_juros = valor_multa = valor_cobranca = valor_juridica = 0
                valor_corrigido = valor_original

                if conta.data_vencimento and conta.data_vencimento < hoje:
                    dias_atraso = (hoje - conta.data_vencimento).days
                    meses_atraso = dias_atraso / 30

                    valor_juros = valor_original * 0.01 * meses_atraso
                    valor_multa = valor_original * 0.02
                    valor_corrigido += valor_juros + valor_multa

                    if dias_atraso > 5:
                        valor_cobranca = valor_corrigido * 0.10
                        valor_corrigido += valor_cobranca

                    if dias_atraso > 15:
                        valor_juridica = valor_corrigido * 0.10
                        valor_corrigido += valor_juridica

                total_original += valor_original
                total_juros += valor_juros
                total_multa += valor_multa
                total_cobranca += valor_cobranca
                total_juridica += valor_juridica
                total_corrigido += valor_corrigido

                def moeda(valor):
                    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

                contrato_conta = f"{conta.contrato.id if conta.contrato else '-'} / {conta.id}"

                data.append([
                    Paragraph(contrato_conta, normal),
                    conta.data_vencimento.strftime("%d/%m/%Y") if conta.data_vencimento else "-",
                    moeda(valor_original),
                    moeda(valor_juros),
                    moeda(valor_multa),
                    moeda(valor_cobranca),
                    moeda(valor_juridica),
                    moeda(valor_corrigido),
                    Paragraph(conta.get_situacao_display(), normal),
                ])

            data.append([
                "", moeda(total_original), moeda(total_juros), moeda(total_multa),
                moeda(total_cobranca), moeda(total_juridica), moeda(total_corrigido), "", ""
            ])

            table = Table(
                data,
                colWidths=[
                    30 * mm, 25 * mm, 25 * mm, 25 * mm, 25 * mm,
                    25 * mm, 25 * mm, 33 * mm, 28 * mm
                ]
            )

            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (2, 1), (7, -1), 'RIGHT'),
                ('ALIGN', (1, 1), (1, -1), 'CENTER'),
                ('ALIGN', (8, 1), (8, -1), 'CENTER'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('BACKGROUND', (0, -1), (-1, -1), colors.whitesmoke),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ]))

            story.append(table)
            story.append(Spacer(1, 15))

            if index < len(clientes) - 1:
                story.append(PageBreak())

        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Spereta Empreendimentos</b>", normal))
        story.append(Paragraph("Relatório gerado por: Lexsys", normal))

        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename=\"relatorio_financeiro.pdf\"'
        response.write(pdf)
        return response

@admin.register(Banco)
class BancoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codigo_compensacao')


@admin.register(Boleto)
class BoletoAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'documento', 'situacao', 'banco', 'cedente', 'acoes_links')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:boleto_id>/gerar/', self.admin_site.admin_view(self.gerar_boleto_view), name='gerar_boleto_view'),
            path('<int:boleto_id>/visualizar/', self.admin_site.admin_view(self.visualizar_boleto), name='visualizar_boleto'),
        ]
        return custom_urls + urls

    def gerar_boleto_view(self, request, boleto_id):
        boleto = Boleto.objects.select_related('conta_vinculada', 'banco').get(pk=boleto_id)
        inter = BancoInterBoleto()

        try:
            token = inter.gera_token()
            conta = boleto.conta_vinculada
            cliente = conta.cliente

            pagador = {
                "cpfCnpj": cliente.cpf or cliente.cnpj,
                "tipoPessoa": "FISICA" if cliente.tipo == 'F' else "JURIDICA",
                "nome": cliente.nome_completo or cliente.razao_social,
                "endereco": cliente.endereco,
                "numero": cliente.numero,
                "complemento": cliente.complemento or "",
                "bairro": "Centro",
                "cidade": cliente.cidade.nome,
                "uf": cliente.cidade.estado.sigla,
                "cep": "98400000",
                "email": cliente.email,
                "telefone": cliente.telefone or cliente.celular or ""
            }

            valor_boleto = float(conta.valor)
            vencimento = conta.data_vencimento.strftime("%Y-%m-%d")

            data = inter.gera_boleto(
                token,
                valor=valor_boleto,
                data_vencimento=vencimento,
                seu_numero=str(boleto.id).zfill(6),
                pagador=pagador,
                mensagem={
                    "linha1": boleto.descricao or "Serviços contratados.",
                    "linha2": "Não aceitar após o vencimento."
                }
            )

            codigo = data.get('codigoSolicitacao')
            if not codigo:
                messages.error(request, f"Erro ao gerar boleto: {data}")
                return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

            boleto.codigo_inter = codigo
            boleto.situacao = "Emitido"
            boleto.save(update_fields=["codigo_inter", "situacao"])

            pdf_data = inter.retorna_pdf(codigo, token)
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="boleto_{boleto.id}.pdf"'
            return response

        except Exception as e:
            messages.error(request, f"Erro ao gerar boleto: {str(e)}")
            return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    def visualizar_boleto(self, request, boleto_id):
        inter = BancoInterBoleto()
        boleto = Boleto.objects.get(pk=boleto_id)

        try:
            token = inter.gera_token()
            pdf_data = inter.retorna_pdf(boleto.codigo_inter, token)
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="boleto_{boleto.id}.pdf"'
            return response

        except Exception as e:
            messages.error(request, f"Erro ao carregar PDF: {str(e)}")
            return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    def acoes_links(self, obj):
        gerar_url = f"/admin/core/boleto/{obj.id}/gerar/"
        visualizar_url = f"/admin/core/boleto/{obj.id}/visualizar/"

        return format_html(
            '<div style="display:flex; gap:8px;">'
            '<a href="{}" target="_blank" style="padding:4px 8px; background:#2b6cb0; color:white; border-radius:4px; text-decoration:none;">Gerar</a>'
            '<a href="{}" target="_blank" style="padding:4px 8px; background:#38a169; color:white; border-radius:4px; text-decoration:none;">Ver</a>'
            '</div>',
            gerar_url,
            visualizar_url
        )
    acoes_links.short_description = "Ações"


@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'sigla', 'regiao_nome')
    search_fields = ('nome', 'sigla', 'regiao_nome')


@admin.register(Cidade)
class CidadeAdmin(admin.ModelAdmin):
    list_display = ('nome', 'estado', 'microrregiao', 'mesorregiao')
    search_fields = ('nome',)
    list_filter = ('estado',)


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'data_criacao', 'data_inicio', 'data_fim')
    search_fields = ('cliente',)


@admin.register(FormaPagamento)
class FormaPagamentoAdmin(admin.ModelAdmin):
    list_display = ('empresa', 'tipo', 'situacao', 'data_cancelamento')
    list_filter = ('tipo', 'situacao', 'empresa')
    search_fields = ('empresa__nome', 'observacao')
    autocomplete_fields = ('empresa',)
