import './Reports.css';

type ReportsProps = {
    isActive: boolean;
}

function Reports({ isActive }: ReportsProps) {
    if (!isActive) {
        return <></>;
    }

    return (
        <div id="reports-container">
            <h1>Relatórios</h1>
            <span className="screen-line" />
        </div>
    );
}

export default Reports;