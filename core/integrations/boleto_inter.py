import base64
import os
import requests
import json
from datetime import datetime, timedelta
from django.conf import settings

BASE_DIR = os.path.join(settings.BASE_DIR, 'core', 'integrations')

CLIENT_OID = '1da5d5d6-7238-4676-9582-229cf04910ad'
CLIENT_SECRET = 'efc981b9-ceb9-424e-b085-60ac0f3c579a'
CERT = (
    os.path.join(BASE_DIR, 'certificado.crt'),
    os.path.join(BASE_DIR, 'certificado.key'),
)

AUTH_URL = 'https://cdpj.partners.bancointer.com.br/oauth/v2/token'
SCOPE = 'boleto-cobranca.read boleto-cobranca.write'
BOLETO_URL = "https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas"
CONTACORRENTE = '348748965'

class Boleto:
    def gera_token(self):
        payload = {
            'client_id': CLIENT_OID,
            'client_secret': CLIENT_SECRET,
            'grant_type': 'client_credentials',
            'scope': SCOPE
        }
        r = requests.post(AUTH_URL, data=payload, cert=CERT)
        r.raise_for_status()
        return r.json()['access_token']

    def gera_boleto(self, token, **kwargs):
        headers = {
            "x-conta-corrente": CONTACORRENTE,
            "Authorization": f"Bearer {token}",
            "Content-Type": "Application/json"
        }

        data_venc = kwargs.get("data_vencimento") or (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")

        boleto_data = {
            "seuNumero": kwargs.get("seu_numero", "000001"),
            "valorNominal": float(kwargs.get("valor", 150.75)),
            "dataVencimento": data_venc,
            "numDiasAgenda": 30,
            "pagador": kwargs.get("pagador"),
            "mensagem": kwargs.get("mensagem", {
                "linha1": "Pagamento referente a serviços prestados.",
                "linha2": "Não aceitar após o vencimento."
            })
        }

        response = requests.post(BOLETO_URL, headers=headers, json=boleto_data, cert=CERT)
        return response.json()
    

    def retorna_pdf(self, codigo, token):
        headers = {
            "x-conta-corrente": CONTACORRENTE,
            "Authorization": f"Bearer {token}",
        }
        response = requests.get(f"{BOLETO_URL}/{codigo}/pdf", headers=headers, cert=CERT)

        print(f"{BOLETO_URL}/{codigo}/pdf")

        if response.status_code != 200:
            try:
                print("Response Content:", response.content)
                erro = response.json()
            except:
                erro = response.text
            raise Exception(f"Erro ao obter PDF: {erro}")

        data = response.json()
        print(data)

        if "pdf" not in data:
            raise Exception(f"Resposta inesperada: {data}")
        
        pdf_base64 = data["pdf"]
        pdf_bytes = base64.b64decode(pdf_base64)

        return pdf_bytes
