from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Banco, Boleto, Cidade, Cliente, Conta, Contrato, Empresa, Estado, FormaPagamento

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'
        
class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

    def validate(self, data):
        tipo = data.get('tipo')

        if tipo == 'F':
            obrigatorios = ['cpf', 'rg', 'sexo', 'data_nascimento']
        elif tipo == 'J':
            obrigatorios = ['cnpj', 'razao_social']
        else:
            raise serializers.ValidationError({'tipo': 'Tipo de pessoa inválido.'})

        for campo in obrigatorios:
            if not data.get(campo):
                raise serializers.ValidationError({campo: f'{campo} é obrigatório para tipo {tipo}.'})

        return data

class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = '__all__'

class CidadeSerializer(serializers.ModelSerializer):
    estado = EstadoSerializer(read_only=True)
    estado_id = serializers.PrimaryKeyRelatedField(queryset=Estado.objects.all(), source='estado', write_only=True)

    class Meta:
        model = Cidade
        fields = ['id', 'ibge_id', 'nome', 'microrregiao', 'mesorregiao', 'estado', 'estado_id']

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class FormaPagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormaPagamento
        fields = '__all__'
        read_only_fields = ['data_cancelamento']


class ContratoSerializer(serializers.ModelSerializer):
    forma_pagamento = FormaPagamentoSerializer()

    class Meta:
        model = Contrato
        fields = '__all__'

    def create(self, validated_data):
        forma_pagamento_data = validated_data.pop('forma_pagamento')
        forma_pagamento = FormaPagamento.objects.create(**forma_pagamento_data)
        contrato = Contrato.objects.create(forma_pagamento=forma_pagamento, **validated_data)
        return contrato

    def update(self, instance, validated_data):
        forma_pagamento_data = validated_data.pop('forma_pagamento', None)

        if forma_pagamento_data:
            for attr, value in forma_pagamento_data.items():
                setattr(instance.forma_pagamento, attr, value)
            instance.forma_pagamento.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class ContaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conta
        fields = '__all__'
        read_only_fields = ['data_criacao', 'data_atualizacao']

class ConsultaClienteSerializer(serializers.Serializer):
    class Meta:
        model = Conta
        fields = '__all__'

class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = '__all__'


class BoletoSerializer(serializers.ModelSerializer):
    banco_nome = serializers.CharField(source='banco.nome', read_only=True)

    class Meta:
        model = Boleto
        fields = '__all__'
