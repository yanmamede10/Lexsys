import { useState } from 'react';

import * as tags from '../../data/tags.json';

import Dashboard from './dashboard/Dashboard';
import RegisterInvoice from './register-invoice/RegisterInvoice';
import RegisterClient from './register-client/RegisterClient';
import RegisterContract from './register-contract/RegisterContract';
import QueryGeneral from './query-general/QueryGeneral';

import Header from '../../common/header/Header';
import Sidebar from '../../common/sidebar/Sidebar';

import './Main.css';
import Reports from './reports/Reports';

function Main() {
    const [index, chooseIndex] = useState(tags.page_index.DASHBOARD);
    const [superActiveButton, setSuperActiveButton] = useState(tags.sidebar_super_button.DASHBOARD);

    let main = (
        <div id='main-container'>
            <div id="main-header">
                <Header />
            </div>
            <div id="main-content">
                <Sidebar chooseIndex={chooseIndex} superActiveButton={superActiveButton} setSuperActiveButton={setSuperActiveButton} />
                <div id="main-block">
                    <Dashboard isActive={index == tags.page_index.DASHBOARD} chooseIndex={chooseIndex} setSuperActiveButton={setSuperActiveButton}/>
                    <QueryGeneral isActive={index == tags.page_index.CONSULTA_GERAL} />
                    <RegisterClient isActive={index == tags.page_index.CLIENTE_REGISTRO} chooseIndex={chooseIndex} />
                    <RegisterContract isActive={index == tags.page_index.CONTRATO_REGISTRO} />
                    <RegisterInvoice isActive={index == tags.page_index.CONTA_REGISTRO} />
                    <Reports isActive={index == tags.page_index.RELATORIO} />
                </div>
            </div>
        </div>
    );



    return main;
}

export default Main;
