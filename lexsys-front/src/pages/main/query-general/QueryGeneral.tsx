import { useEffect, useState } from "react";

import type { FormEvent, JSX, MouseEvent } from "react";

import type { Cliente, Conta, Contrato } from '../../../data/types';

import Select, { type OptionType } from '../../../components/select/Select';

import './QueryGeneral.css';
import Selectable from "../../../components/selectable/Selectable";
import axios from "axios";

interface QueryGeneralProps {
    isActive: boolean;
}

function QueryGeneral({ isActive }: QueryGeneralProps) {
    if (!isActive) {
        return <></>;
    }

    const [queryType, setQueryType] = useState("contas");

    const [initialDate, setInitialDate] = useState("");
    const [finalDate, setFinalDate] = useState("");

    const [client, setClient] = useState('');
    const [clientOptions, setClientOptions] = useState<OptionType[]>([]);
    const [clientIsLoading, setClientIsLoading] = useState(true);
    const [clientsPages, setClientsPages] = useState<JSX.Element[][]>([[]]);

    const [contract, setContract] = useState('');
    const [contractOptions, setContractOptions] = useState<OptionType[]>([]);
    const [contractIsLoading, setContractIsLoading] = useState(true);
    const [contractsPages, setContractsPages] = useState<JSX.Element[][]>([[]]);

    const [invoices, setInvoices] = useState<Array<Conta>>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [aggregatedInvoiceValues, setAggregatedInvoiceValues] = useState<Array<Conta>>([]);
    const [invoicesPages, setInvoicesPages] = useState<JSX.Element[][]>([[]]);

    const [paymentMethod, setPaymentMethod] = useState('boleto');

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
            })
            
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
                data.map((contract: Contrato) =>
                    options.push({
                        value: contract.id.toString(),
                        label: `Cliente ID:${contract.cliente} - ${contract.data_inicio} -> ${contract.data_fim}`
                    })
                )
                setContractOptions(options);
                setContractIsLoading(false);
            });
            queryGeneral();
        }, []);

    const [invoicePaymentPopupVisibility, setInvoicePaymentPopupVisibility] = useState('hidden');
    const [invoiceCancellationPopupVisibility, setInvoiceCancellationPopupVisibility] = useState('hidden');
    const [invoiceID, setInvoiceID] = useState<number|null>(null);

    function payInvoice() {
        fetch(`http://18.231.0.182:8000/api/contas/${invoiceID}/quitar/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
        })
            .then(_ => {
                let invoicesCopy = [...invoices];
                let payedInvoice = invoicesCopy.findIndex((e: Conta) => e.id == invoiceID);
                invoicesCopy[payedInvoice].situacao = 'quitado';
                setInvoices(invoicesCopy);
                setInvoicePagesValues(invoicesCopy);
                setInvoicePaymentPopupVisibility('hidden');
            })
    }

    function cancelInvoice() {
        fetch(`http://18.231.0.182:8000/api/contas/${invoiceID}/cancelar/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
        })
            .then(_ => {
                let invoicesCopy = [...invoices];
                let cancelledInvoice = invoicesCopy.findIndex((e: Conta) => e.id == invoiceID);
                invoicesCopy[cancelledInvoice].situacao = 'cancelado';
                setInvoices(invoicesCopy);
                setInvoicePagesValues(invoicesCopy);
                setInvoiceCancellationPopupVisibility('hidden');
            })
    }

    const invoicePaymentPopup = (
        <div id='querygeneral-invoicepaymentpopup-container' className={invoicePaymentPopupVisibility}>
            <h1>Quitar Conta #{invoiceID}</h1>
            <span className="screen-line"></span>
            {
                paymentMethodData.map((data) => (
                    <Selectable type='radio' text={data.text} checked={paymentMethod == data.tag} onChange={() => setPaymentMethod(data.tag)} />
                ))
            }
            <div className="buttons">
                <button onClick={() => payInvoice()}>Confirmar</button>
                <button onClick={() => setInvoicePaymentPopupVisibility('hidden')}>Cancelar</button>
            </div>
        </div>
    );

    const invoiceCancellationPopup = (
        <div id='querygeneral-invoicecancellationpopup-container' className={invoiceCancellationPopupVisibility}>
            <h1>Cancelar Conta #{invoiceID}</h1>
            <span className="screen-line"></span>
            <div className="buttons">
                <button onClick={() => cancelInvoice()}>Confirmar</button>
                <button onClick={() => setInvoiceCancellationPopupVisibility('hidden')}>Cancelar</button>
            </div>
        </div>
    );

    function showInvoicePaymentPopup(invoiceId: number) {
        setInvoicePaymentPopupVisibility('shown');
        setInvoiceCancellationPopupVisibility('hidden');
        setInvoiceID(invoiceId);
    }

    function showInvoiceCancellationPopup(invoiceId: number) {
        setInvoiceCancellationPopupVisibility('shown');
        setInvoicePaymentPopupVisibility('hidden');
        setInvoiceID(invoiceId);
    }

    const [sort, setSort] = useState("");

    let checkBoxFiltersList: Array<boolean> = [];
    let setCheckBoxFiltersList: Array<React.Dispatch<React.SetStateAction<boolean>>> = [];
    for (let index = 0; index < 5; index++) {
        const [cb, setCb] = useState(false);
        checkBoxFiltersList.push(cb);
        setCheckBoxFiltersList.push(setCb);
    }

    function clearFilters(e: MouseEvent) {
        e.preventDefault();
        setCheckBoxFiltersList.forEach(setFunction => {
            setFunction(false);
        });
    }

    function toggleCheckbox(index: number) {
        const setFunction = setCheckBoxFiltersList[index];
        setFunction(!checkBoxFiltersList[index]);
    }

    function generateFilters(all?: 
        {
            situacao?: string,
            select?: string,
            newSelect?: string
            input?: string,
            newInput?: string,
            newSort?: string
        }) {
        const data: {
            cliente?: number,
            contrato?: number,
            data_inicio?: string,
            data_fim?: string,
            ordering?: string,
            situacao?: string,
            reverse?: boolean
        } = {};

        if (client != '')
            data.cliente = +client;
        if (all?.select == 'cliente' && all?.newSelect != undefined) 
            data.cliente = +all.newSelect;

        if (contract != '')
            data.contrato = +contract;
        if (all?.select == 'contrato' && all?.newSelect != undefined) 
            data.contrato = +all.newSelect;

        if (initialDate != '')
            data.data_inicio = initialDate;
        if (all?.input == 'initialDate' && all?.newInput != undefined) 
            data.data_inicio = all.newInput;

        if (finalDate != '')
            data.data_fim = finalDate;
        if (all?.input == 'finalDate' && all?.newInput != undefined) 
            data.data_fim = all.newInput;

        if (sort != '') {
            data.ordering = 'cliente_id';
            data.reverse = (sort == "ascending");
        }
        if (all?.newSort != '') {
            data.ordering = 'cliente_id';
            data.reverse = (sort == "ascending");
        }

        if (all?.situacao)
            data.situacao = all?.situacao;

        return data;
    }

    function queryGeneral(all?: {
        which?: string,
        e?: FormEvent,
        situation?: number,
        newSituation?: boolean,
        select?: string,
        newSelect?: string,
        input?: string,
        newInput?: string,
        newSort?: string
    }) {
        if (!all) {
            all = {};
        }
        all.e?.preventDefault();
        // setAggregatedInvoiceValues([]);

        if (!all.which) {
            all.which = queryType;
        }

        const newCheckboxList = [...checkBoxFiltersList];
        if (all.situation && all.newSituation)
            newCheckboxList[all.situation] = all.newSituation;

        if (all?.which == 'contas') {
            let hasNoCheckboxesChecked: boolean = newCheckboxList.every((val) => val == false);
            let hasAllCheckboxesChecked: boolean = newCheckboxList.every((val) => val == true);
            if (hasNoCheckboxesChecked || hasAllCheckboxesChecked) {
                axios.get(
                    `http://18.231.0.182:8000/api/consultas/${all.which}/`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                        },
                        params: generateFilters(all)
                    }
                ).then(data => data.data.resultados
                ).then(data => {
                    setInvoicePagesValues(data);
                });
                return;
            }
            let requests = [];
            for (let i = 0; i < checkBoxFiltersList.length; i++) {
                if(!checkboxesData[i])
                    continue;
                let req = axios.get(
                    `http://18.231.0.182:8000/api/consultas/${all.which}/`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                        },
                        params: generateFilters({...all, situacao: checkboxesData[i].tag})
                    }
                ).then(data => data.data.resultados
                ).then(data => {
                    aggregateInvoiceValues(data);
                });
                requests.push(req);
                Promise.all(requests)
                .then(_ => {
                    setInvoicePagesValues()
                });
            }
            return;
        }

        axios.get(
            `http://18.231.0.182:8000/api/consultas/${all.which}/`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                },
                params: generateFilters(all)
            }
        ).then(data => data.data.resultados
        ).then(data => {
            if(all.which == 'contratos') {
                setContractsPagesValues(data);
            } else if (all.which == 'clientes') {
                setClientsPagesValues(data);
            }
        });
    }

    const sortOptions = [
        { "value": "ascending", "label": "Crescente" },
        { "value": "descending", "label": "Descrescente" }
    ]

    const selectsData = [
        {
            id: 0,
            setVar: setContract,
            tag: "contrato",
            text: "Contrato",
            options: contractOptions,
            isLoading: contractIsLoading
        },
        {
            id: 1,
            setVar: setClient,
            tag: "cliente",
            text: "Cliente",
            options: clientOptions,
            isLoading: clientIsLoading
        }

    ]

    const inputsData = [
        {
            id: 0,
            "tag": "initialDate",
            "var": initialDate,
            "setVar": setInitialDate,
            "type": "date",
            "text": "Data Inicial"
        },
        {
            id: 1,
            "tag": "finalDate",
            "var": finalDate,
            "setVar": setFinalDate,
            "type": "date",
            "text": "Data Final"
        }

    ]

    const checkboxesData = [
        {
            id: 0,
            "tag": "pendente",
            "text": "Pendente"
        },
        {
            id: 1,
            "tag": "quitado",
            "text": "Quitado"
        },
        {
            id: 2,
            "tag": "parcelado",
            "text": "Parcelado"
        },
        {
            id: 3,
            "tag": "renegociado",
            "text": "Renegociado"
        },
        {
            id: 4,
            "tag": "cancelado",
            "text": "Cancelado"
        }
    ]

    const queryTypesData = [
        {
            tag: 'contratos',
            text: 'Contrato'
        },
        {
            tag: 'clientes',
            text: 'Cliente'
        },
        {
            tag: 'contas',
            text: 'Conta'
        }
    ]

    function setContractsPagesValues(data: Array<Contrato>) {
        if (data.length == 0) {
            setContractsPages([[<h1>Não há contrato com estes parâmetros.</h1>]]);
            return;
        }
        const contractsData = data.map((inv) => {
            return (  
                <tr>
                    <th>{inv.id}</th>
                    <th>{inv.cliente}</th>
                    <th>{inv.data_vencimento}</th>
                </tr>
            );
        })

        let pages: JSX.Element[][] = [];

        contractsData.forEach((inv, ind) => {
            if (ind % 7 == 0) {
                pages.push([]);
            }
            pages[pages.length - 1].push(inv);
        });

        setContractsPages(pages);
    }

    function setClientsPagesValues(data: Array<Cliente>) {
        if (data.length == 0) {
            setClientsPages([[<h1>Não há cliente com estes parâmetros.</h1>]]);
            return;
        }
        const clientsData = data.map((inv) => {
            return (  
                <tr>
                    <th>{inv.id}</th>
                    <th>{inv.nome_completo}</th>
                </tr>
            );
        })

        let pages: JSX.Element[][] = [];

        clientsData.forEach((inv, ind) => {
            if (ind % 7 == 0) {
                pages.push([]);
            }
            pages[pages.length - 1].push(inv);
        });

        setClientsPages(pages);
    }

    function aggregateInvoiceValues(data: Array<Conta>) {
        setAggregatedInvoiceValues([...aggregatedInvoiceValues, ...data])
    }

    function setInvoicePagesValues(data?: Array<Conta>) {
        if (!data)
            data = aggregatedInvoiceValues;
        if (data.length == 0) {
            setInvoicesPages([[<h1>Não há conta com estes parâmetros.</h1>]]);
            return;
        }
        const invoicesData = data.map((inv) => {
            return (  
                <tr>
                    <th>{inv.id}</th>
                    <th>{inv.cliente}</th>
                    <th>{inv.contrato}</th>
                    <th>{inv.data_vencimento}</th>
                    <th>{inv.valor}</th>
                    <th>{inv.situacao}</th>
                    <th>
                        <button
                            onClick={() => showInvoicePaymentPopup(inv.id)}
                            style={{backgroundColor: (inv.situacao != 'quitado') ? 'var(--success)' : 'lightgray'}}
                            disabled={inv.situacao == 'quitado'}>
                                Quitar
                        </button>
                        <button 
                            onClick={() => showInvoiceCancellationPopup(inv.id)}
                            style={{backgroundColor: (inv.situacao != 'cancelado') ? 'var(--failure)' : 'lightgray'}}
                            disabled={inv.situacao == 'cancelado'}>
                                Cancelar
                        </button>
                    </th>
                </tr>
            );
        })

        let pages: JSX.Element[][] = [];

        invoicesData.forEach((inv, ind) => {
            if (ind % 7 == 0) {
                pages.push([]);
            }
            pages[pages.length - 1].push(inv);
        });

        setInvoicesPages(pages);
    }

    const invoicesTable = (
        <div id="invoices-querytable">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Contrato</th>
                        <th>Data de Vencimento</th>
                        <th>Valor</th>
                        <th>Situação</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {(queryType == 'contas') ? invoicesPages[currentPage].map((inv) => inv): <></>}
                </tbody>
            </table>
            <button onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}>{'<'}</button>
            <button onClick={() => setCurrentPage(Math.min(currentPage + 1, invoicesPages.length - 1))}>{'>'}</button>
        </div>
    );

    const clientsTable = (
        <div id="clients-querytable">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                    </tr>
                </thead>
                <tbody>
                    {(queryType == 'clientes') ? clientsPages[currentPage].map((inv) => inv): <></>}
                </tbody>
            </table>
            <button onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}>{'<'}</button>
            <button onClick={() => setCurrentPage(Math.min(currentPage + 1, clientsPages.length - 1))}>{'>'}</button>
        </div>
    );

    const contractsTable = (
        <div id="contracts-querytable">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Data de Vencimento</th>
                    </tr>
                </thead>
                <tbody>
                    {(queryType == 'contratos') ? contractsPages[currentPage].map((inv) => inv): <></>}
                </tbody>
            </table>
            <button onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}>{'<'}</button>
            <button onClick={() => setCurrentPage(Math.min(currentPage + 1, contractsPages.length - 1))}>{'>'}</button>
        </div>
    );

    const queryTable = (
        <div id="query-table-container">
            {(queryType == 'contas') ? invoicesTable : ''}
            {(queryType == 'clientes') ? clientsTable : ''}
            {(queryType == 'contratos') ? contractsTable : ''}
        </div>
    );

    return (
        <div id="querygeneral-container">
            <h1>Consulta Geral</h1>
            <span className="screen-line" />
            <form onSubmit={(e) => queryGeneral({which: queryType, e: e})}>
                <div className="form-line not-sparse">
                    {queryTypesData.map((data) => (
                        <Selectable type="radio" checked={queryType == data.tag} onChange={() => {setQueryType(data.tag); queryGeneral({which: data.tag})}} text={data.text} />
                    ))}
                </div>
                <div className="form-line">
                    {selectsData.map((data) => (
                        <label>
                            {data.text}
                            <Select options={data.options} isSearchable={true} isLoading={data.isLoading} onChange={(value) => {
                                data.setVar(value?.value || '');
                                queryGeneral({select: data.tag, newSelect: value?.value});
                            }} />
                        </label>
                    ))}
                </div>
                <div className="form-line">
                    {inputsData.map((data) => (
                        <label>
                            {data.text}
                            <input type={data.type} name={data.tag} value={data.var} onChange={(e) => {
                                data.setVar(e.target.value);
                                queryGeneral({input: data.tag, newInput: e.target.value});
                            }}></input>
                        </label>
                    ))}
                    <label>
                        Ordenar
                        <Select options={sortOptions} onChange={(value) => {
                            setSort(value?.value || '');
                            queryGeneral({newSort: value?.value});
                        }} />
                    </label>
                </div>
                <h2>Situação</h2>
                <div className="form-line">
                    {checkboxesData.map((data, i) => (
                        <Selectable type="checkbox" checked={checkBoxFiltersList[i]} onChange={() => {toggleCheckbox(i); queryGeneral({situation: i, newSituation: !checkBoxFiltersList[i]})}} text={data.text} />
                    ))}
                    <button onClick={(e) => {clearFilters(e); queryGeneral({which: queryType, e: e})}}>Limpar Filtros</button>
                </div>
                {/* <button type="submit" style={{marginTop: '1.5%'}}>Consultar</button> */}
            </form >
            {queryTable}
            {invoicePaymentPopup}
            {invoiceCancellationPopup}
        </div >
    );
}

export default QueryGeneral;
