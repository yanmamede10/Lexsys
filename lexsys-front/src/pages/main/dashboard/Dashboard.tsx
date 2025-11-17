import { useEffect, useState } from "react";

import * as tags from '../../../data/tags.json';

import './Dashboard.css';
import type { Boleto, Cliente, Conta, Contrato } from "../../../data/types";

interface DashboardProps {
    isActive: boolean;
    chooseIndex: React.Dispatch<React.SetStateAction<string>>;
    setSuperActiveButton: React.Dispatch<React.SetStateAction<string>>;
}

function generateReport() {
    console.log("TODO: Gerando relatório...");
}

function Dashboard({ isActive, chooseIndex, setSuperActiveButton }: DashboardProps) {
    if (!isActive) {
        return <></>;
    }

    const [clientsAmount, setClientsAmount] = useState("...");
    const [activeContracts, setActiveContracts] = useState("...");
    const [pendingBoletos, setPendingBoletos] = useState("...");

    const [lastClientName, setLastClientName] = useState("-");
    const [lastClientDate, setLastClientDate] = useState("-");
    const [lastBoletoName, setLastBoletoName] = useState("-");
    const [lastBoletoDate, setLastBoletoDate] = useState("-");
    const [lastInvoiceName, setLastInvoiceName] = useState("-");
    const [lastInvoiceDate, setLastInvoiceDate] = useState("-");

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
                setClientsAmount(data.length);
                if (data.length > 0) {
                    data.sort((a: Cliente, b: Cliente) => new Date(b.data_atualizacao).getTime() - new Date(a.data_atualizacao).getTime());
                    setLastClientName(data[0].nome_completo);
                    setLastClientDate(new Date(data[0].data_atualizacao).toString());
                }

            });
        fetch(`http://18.231.0.182:8000/api/contratos/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
            },
        })
            .then(res => res.json())
            .then(data => {
                data.filter((c: Contrato) => new Date(c.data_fim).getTime() < new Date().getTime())
                setActiveContracts(data.length);
            });
        fetch(`http://18.231.0.182:8000/api/contas/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    data.sort((a: Conta, b: Conta) => new Date(b.data_atualizacao).getTime() - new Date(a.data_atualizacao).getTime());
                    setLastInvoiceName(`ID:${data[0].id} Cl:${data[0].cliente} Co:${data[0].contrato} V:${data[0].valor}`);
                    setLastInvoiceDate(new Date(data[0].data_atualizacao).toString());
                }
            });
        fetch(`http://18.231.0.182:8000/api/consultas/boletos/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
            },
        })
            .then(res => res.json())
            .then(rawData => rawData.resultados)
            .then(data => {
                setPendingBoletos(data.filter((boleto: Boleto) => boleto.situacao == 'pendente').length);
                if (data.length > 0) {
                    data.sort((a: Boleto, b: Boleto) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime());
                    setLastBoletoName(data[0].nome_completo);
                    setLastBoletoDate(new Date(data[0].data_criacao).toString());
                }
            });
        
    }, []);

    return (
        <div id="dashboard-container">
            <div id="dashboard-top-contents">
                <div id="dashboard-databox-container">
                    <div className="data-box">
                        <h2>Clientes Cadastrados</h2>
                        <p>{clientsAmount}</p>
                    </div>
                    <div className="data-box">
                        <h2>Contratos Ativos</h2>
                        <p>{activeContracts}</p>
                    </div>
                    <div className="data-box">
                        <h2>Boletos Pendentes</h2>
                        <p>{pendingBoletos}</p>
                    </div>
                </div>
                <div id="dashboard-create-buttons-container">
                    <button className="create-button" onClick={() => {chooseIndex(tags.page_index.CLIENTE_REGISTRO); setSuperActiveButton(tags.sidebar_super_button.CLIENTE)}}>+ Novo Cliente</button>
                    <button className="create-button" onClick={() => {chooseIndex(tags.page_index.CONTRATO_REGISTRO); setSuperActiveButton(tags.sidebar_super_button.CONTRATO)}}>+ Novo Contrato</button>
                    <button className="create-button" onClick={() => {chooseIndex(tags.page_index.CONTA_REGISTRO); setSuperActiveButton(tags.sidebar_super_button.CONTA)}}>+ Gerar Conta</button>
                </div>
            </div>
            <div id="dashboard-last-registries">
                <h1>Últimos Registros</h1>
                <span className="screen-line" />
                <div id="dashboard-table-container">
                    <table rules="rows">
                        <tbody>
                            <tr>
                                <th>Tipo</th>
                                <th>Nome/Descrição</th>
                                <th>Data</th>
                            </tr>
                            <tr>
                                <td>Cliente</td>
                                <td>{lastClientName}</td>
                                <td>{lastClientDate}</td>
                            </tr>
                            <tr>
                                <td>Boleto</td>
                                <td>{lastBoletoName}</td>
                                <td>{lastBoletoDate}</td>
                            </tr>
                            <tr>
                                <td>Conta</td>
                                <td>{lastInvoiceName}</td>
                                <td>{lastInvoiceDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <span>
                <button className='generate-report' onClick={() => generateReport()}>Gerar Relatório</button>
            </span>
        </div>
    );
}

export default Dashboard;
