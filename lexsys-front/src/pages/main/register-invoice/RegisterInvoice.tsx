import { useEffect, useState, type FormEvent } from 'react';
import Select, { type OptionType } from '../../../components/select/Select';
import './RegisterInvoice.css';
import type { SingleValue } from 'react-select';
import axios from 'axios';
import type { Cliente } from '../../../data/types';

interface RegisterInvoiceProps {
    isActive: boolean;
}

function RegisterInvoice({ isActive }: RegisterInvoiceProps) {
    if (!isActive) {
        return <></>;
    }

    const [situation, setSituation] = useState('');
    const situationOptions = [
        { "value": "pendente", "label": "Pendente" },
        { "value": "quitado", "label": "Quitado" },
        { "value": "parcelado", "label": "Parcelado" },
        { "value": "renegociado", "label": "Renegociado" },
        { "value": "cancelado", "label": "Cancelado" }
    ]

    const [client, setClient] = useState('');
    const [clientOptions, setClientOptions] = useState<OptionType[]>([]);
    const [clientIsLoading, setClientIsLoading] = useState(true);

    const [contract, setContract] = useState('');
    const [contractOptions, setContractOptions] = useState<OptionType[]>([]);
    const [contractIsLoading, setContractIsLoading] = useState(true);

    const [dueDate, setDueDate] = useState('');
    const [invoiceValue, setInvoiceValue] = useState('');
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
                data.map((client: Cliente) =>
                    options.push({
                        value: client.id.toString(),
                        label: client.nome_completo
                    })
                )
                setClientOptions(options);
                setClientIsLoading(false);
            });
    }, []);

    function setClientAndFetchContracts(value: SingleValue<any>) {
        setClient(value?.value || '');

        const targetClient = clientOptions.find((c) => c.label == value?.label);

        fetch(`http://18.231.0.182:8000/api/contratos/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
            },
        })
            .then(res => res.json())
            .then(data => {
                let options: OptionType[] = [];
                data.map((contract: { id: number, cliente: number }) => {
                    if (contract.cliente.toString() == targetClient?.value) {
                        options.push({
                            value: contract.id.toString(),
                            label: `${value?.label} - ${contract.id}`
                        })
                    }
                }
                )
                setContractOptions(options);
                setContractIsLoading(false);
            });
    }

    function buildData() {
        let data = {
            cliente: client,
            data_vencimento: dueDate,
            contrato: contract,
            empresa: 1,
            valor: invoiceValue,
            observacao: observation,
            situacao: situation
        }

        return data;
    }

    function registerInvoice(e: FormEvent) {
        e.preventDefault();

        const data = buildData();

        axios.post(
            'http://18.231.0.182:8000/api/contas/',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
            }
        ).then(res => {
            if(res.status == 201) {
                console.log('Successfully registered new invoice.');
            }
        });
    }

    return (
        <div id="register-invoice-container">
            <h1>Cadastro de Conta</h1>
            <span className="screen-line" />
            <form id="register-invoice-form" onSubmit={(e) => registerInvoice(e)}>
                <div className="form-line">
                    <label>
                        Cliente
                        <Select options={clientOptions} isSearchable={true} isLoading={clientIsLoading} onChange={(v) => setClientAndFetchContracts(v)} />
                    </label>
                    <label>
                        Data de Vencimento
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} name="due_date" autoComplete='off' />
                    </label>
                    <label>
                        Situação
                        <Select options={situationOptions} onChange={(value) => {
                            setSituation(value?.value || '');
                        }} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Valor
                        <input type="number" value={invoiceValue} onChange={(e) => setInvoiceValue(e.target.value)} name="value" autoComplete='off' />
                    </label>
                    <label>
                        Vincular Contrato
                        <Select options={contractOptions} isSearchable={true} isLoading={contractIsLoading} onChange={(value) => {
                            setContract(value?.value || '');
                        }} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Observação
                        <input type="text" name="obs" value={observation} onChange={(e) => setObservation(e.target.value)}  autoComplete='off' />
                    </label>
                </div>
                <input type="submit" value="Cadastrar" />
            </form>
        </div>

    );
}

export default RegisterInvoice;
