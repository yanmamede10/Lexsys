-- criando ambiente virtual, ativando ele e instalando libs
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt

-- migraçao de banco de dados
> python manage.py makemigrations
> python manage.py migrate

-- crie um usuário admin para poder acessar a página admin
-- e também conseguir usar/criar usuários
> python manage.py createsuperuser

-- para acessar http://127.0.0.1:8000/admin/ (com usuario admin você conseguirá ver todo o fluxo do sistema, podendo criar tudo que já está pronto de modelos e visualizando isso para aplicar no consumo da API)

-- rodar o servidor
python manage.py runserver

API:
pegando token para conseguir usar a API, use o usuário admin pode ser usado

POST /api/token/
{
  "username": "seu_usuario",
  "password": "sua_senha"
}

em qualquer requisição para endpoints autenticados (clientes, contratos, contas, consultas...), envie o header de autorização:

