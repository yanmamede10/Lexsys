import * as tags from '../../data/tags.json';

import './Sidebar.css';

interface SidebarProps {
    chooseIndex: React.Dispatch<React.SetStateAction<string>>; // State set function
    superActiveButton: string;
    setSuperActiveButton: React.Dispatch<React.SetStateAction<string>>; // State set function
}

/*
ARQUITETURA DA BARRA LATERAL:

Dashboard <super>
Consulta <super>
Clientes - Cadastro <super>
Contratos - Cadastro <super>
Contas - Cadastro <super>
Relatórios <super>


*/



function Sidebar({ chooseIndex, superActiveButton, setSuperActiveButton }: SidebarProps) {

    const isSuperButtonActive = (tag: string) => {
        return (superActiveButton == tag) ? "chosen-super-button" : "";
    }

    const buttonsData = [
        { // Dashboard
            id: 0,
            "className": isSuperButtonActive(tags.sidebar_super_button.DASHBOARD),
            "onClick": () => {
                chooseIndex(tags.page_index.DASHBOARD);
                setSuperActiveButton(tags.sidebar_super_button.DASHBOARD);
            },
            "hidden": false,
            "text": "Dashboard"
        },
        { // Consulta
            id: 1,
            "className": isSuperButtonActive(tags.sidebar_super_button.CONSULTA),
            "onClick": () => {
                chooseIndex(tags.page_index.CONSULTA_GERAL);
                setSuperActiveButton(tags.sidebar_super_button.CONSULTA);
            },
            "hidden": false,
            "text": "Consulta"
        },
        { // Clientes - Cadastro
            id: 2,
            "className": isSuperButtonActive(tags.sidebar_super_button.CLIENTE),
            "onClick": () => {
                chooseIndex(tags.page_index.CLIENTE_REGISTRO);
                setSuperActiveButton(tags.sidebar_super_button.CLIENTE);
            },
            "hidden": false,
            "text": "Clientes"
        },
        { // Contratos - Cadastro
            id: 4,
            "className": isSuperButtonActive(tags.sidebar_super_button.CONTRATO),
            "onClick": () => {
                chooseIndex(tags.page_index.CONTRATO_REGISTRO);
                setSuperActiveButton(tags.sidebar_super_button.CONTRATO);
            },
            "hidden": false,
            "text": "Contratos"
        },
        { // Contas - Cadastro
            id: 5,
            "className": isSuperButtonActive(tags.sidebar_super_button.CONTA),
            "onClick": () => {
                chooseIndex(tags.page_index.CONTA_REGISTRO);
                setSuperActiveButton(tags.sidebar_super_button.CONTA);
            },
            "hidden": false,
            "text": "Contas"
        },
        { // Relatórios
            id: 6,
            "className": isSuperButtonActive(tags.sidebar_super_button.RELATORIO),
            "onClick": () => {
                chooseIndex(tags.page_index.RELATORIO);
                setSuperActiveButton(tags.sidebar_super_button.RELATORIO);
            },
            "hidden": false,
            "text": "Relatórios"
        },

    ]

    return (
        <div id="sidebar-container">
            <div id="sidebar-main">
                {buttonsData.map((data) => <button className={data.className} hidden={data.hidden} onClick={(data.onClick)}>{data.text}</button>)}
            </div>
        </div>
    );
}

export default Sidebar;
