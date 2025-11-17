import base64

class PDF:
    def gera_pdf(self, pdf):
        return base64.b64encode(pdf).decode('utf-8')
    
    def salva_pdf(self, pdf, caminho):
        with open(caminho, 'wb') as f:
            f.write(pdf)
