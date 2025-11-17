import { useEffect, useState, type FormEvent } from 'react';
import Selectable from '../../../components/selectable/Selectable';
import './RegisterContract.css';
import Select, { type OptionType } from '../../../components/select/Select';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface RegisterContractProps {
    isActive: boolean;
}

function RegisterContract({ isActive }: RegisterContractProps) {
    if (!isActive) {
        return <></>;
    }

    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState('');
    const [situation, setSituation] = useState('');

    const [client, setClient] = useState('');
    const [clientOptions, setClientOptions] = useState<OptionType[]>([]);
    const [clientIsLoading, setClientIsLoading] = useState(true);

    const [signatureDate, setSignatureDate] = useState('');
    const [finalDate, setFinalDate] = useState('');
    const [initialDate, setInitialDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [monthlyFee, setMonthlyFee] = useState('');
    const [cancelDate, setCancelDate] = useState('');

    const [observation, setObservation] = useState('');

    useEffect(() => {
        fetch(`http://18.231.0.182:8000/api/clientes/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
            },
        })
            .then(res => res.json())
            .then(data => {
                let options: OptionType[] = [];
                data.map((client: { id: number, nome_completo: string }) =>
                    options.push({
                        value: client.id.toString(),
                        label: client.nome_completo
                    })
                )
                setClientOptions(options);
                setClientIsLoading(false);
            });
    }, []);

    const paymentMethodData = [
        {
            id: 0,
            text: 'Cartão de Crédito',
            tag: 'credito',
        },
        {
            id: 1,
            text: 'Cartão de Débito',
            tag: 'debito'
        },
        {
            id: 2,
            text: 'Pix',
            tag: 'pix'
        },
        {
            id: 3,
            text: 'Dinheiro',
            tag: 'dinheiro'
        },
        {
            id: 4,
            text: 'Boleto',
            tag: 'boleto'
        }
    ]

    const situationOptions = [
        { "value": "ativo", "label": "Ativo" },
        { "value": "inativo", "label": "Inativo" },
        { "value": "cancelado", "label": "Cancelado" }
    ]

    function buildData() {
        let data = {
            cliente: client,
            data_assinatura: signatureDate,
            data_fim: finalDate,
            data_inicio: initialDate,
            data_vencimento: dueDate,
            empresa: 1,
            forma_pagamento: {
                empresa: 1,
                tipo: paymentMethod
            },
            mensalidade: monthlyFee,
            data_cancelamento: cancelDate,
            situation: situation
        }

        return data;
    }

    function registerContract(e: FormEvent) {
        e.preventDefault();

        const data = buildData();

        axios.post(
            'http://18.231.0.182:8000/api/contratos/',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
            }
        );

        navigate('/');
    }

    return (
        <div id="register-contract-container">
            <h1>Cadastro de Contrato</h1>
            <span className="screen-line" />
            <form id="register-contract-form" onSubmit={(e) => registerContract(e)}>
                <div className="form-line">
                    <label>
                        Data Inicial
                        <input type="date" name="initial_date" autoComplete='off' value={initialDate} onChange={(e) => setInitialDate(e.target.value)} />
                    </label>
                    <label>
                        Data Final
                        <input type="date" name="final_date" autoComplete='off' value={finalDate} onChange={(e) => setFinalDate(e.target.value)} />
                    </label>
                    <label>
                        Dia de Vencimento
                        <input type="number" name="due_date" autoComplete='off' value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Cliente
                        <Select options={clientOptions} isSearchable={true} isLoading={clientIsLoading} onChange={(value) => {
                            setClient(value?.value || '');
                        }} />
                    </label>
                    <label>
                        Data de Assinatura
                        <input type="date" name="signature_date" autoComplete='off' value={signatureDate} onChange={(e) => setSignatureDate(e.target.value)} />
                    </label>
                    <label>
                        Mensalidade
                        <input type="number" name="fee" autoComplete='off' value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
                    </label>
                </div>
                <h2>Forma de Pagamento</h2>
                <div className="form-line">
                    {
                        paymentMethodData.map((data) => (
                            <Selectable type='radio' text={data.text} checked={paymentMethod == data.tag} onChange={() => setPaymentMethod(data.tag)} />
                        ))
                    }
                </div>
                <div className="form-line">
                    <label>
                        Situação
                        <Select options={situationOptions} onChange={(value) => {
                            setSituation(value?.value || '');
                        }} />
                    </label>
                    <label className={(situation == 'cancelled') ? '' : 'hidden'}>
                        Data de Cancelamento
                        <input type="date" name="cancel_date" autoComplete='off' value={cancelDate} onChange={(e) => setCancelDate(e.target.value)} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Observação
                        <input type="text" name="obs" autoComplete='off' value={observation} onChange={(e) => setObservation(e.target.value)} />
                    </label>
                </div>
                <input type="submit" value="Cadastrar" />
            </form>
        </div>
    );
}

export default RegisterContract;
