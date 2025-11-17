import './Header.css';

import Logo from '../../assets/logo.png';

function Header() {
    return (
        <div id="header-container">
            {/* <img src='logo.webp' id="header-lexsyslogo"></img> */}
            <img src={Logo} id="header-empresalogo" />
            <h3>Spereta Empreendimentos</h3>
        </div>
    );
}

export default Header;
