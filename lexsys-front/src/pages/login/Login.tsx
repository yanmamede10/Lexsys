import { useEffect, useState } from 'react';
import './Login.css';

import { useNavigate } from "react-router-dom";
import Token from '../../auth/Token';
import Toast from '../../common/toast/Toast';

function Login() {
    const navigate = useNavigate();

    const [passwordInputType, setPasswordInputType] = useState("password");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [toastShow, setToastShow] = useState(false);
    const [toastText, setToastText] = useState("");
    const [toastType, setToastType] = useState("error");
    
    useEffect(() => {
        (async function () {
            const verifyAcc = await Token.verifyAccessToken();
            const verifyRef = await Token.verifyRefreshToken();
            if (verifyRef) {
                if (!verifyAcc) {
                    Token.refreshToken();
                }
                navigate('/');
            }
        }());
    }, []);

    function togglePasswordVisibility() {
        setPasswordInputType((passwordInputType === "password") ? "text" : "password");
    }

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const user = {
            username: username,
            password: password
        };

        Token.getTokenPair(user);

        navigate('/');
    }

    let login = (
        <div id="login-container">
            <img src="logo.webp" alt="Lexsys" className="logo" />
            <div className="form-container">
                <form method="post" action="" onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Usuário</label>
                        <input type="text" id="username" name="username" value={username} onChange={(e) => { setUsername(e.target.value) }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input type={passwordInputType} id="password" name="password" value={password} onChange={(e) => { setPassword(e.target.value) }} />
                        <span id="togglePassword" className="material-icons toggle-password" onClick={togglePasswordVisibility}>
                            <img src="eye-open.svg" hidden={(passwordInputType !== "text")} alt="visível" />
                            <img src="eye-closed.svg" hidden={(passwordInputType !== "password")} alt="invisível" />
                        </span>
                    </div>
                    <input type="submit" value="Login" />
                </form>
            </div>
            <Toast show={toastShow} type={toastType} text={toastText} />
        </div>
    );

    return login;
}

export default Login;