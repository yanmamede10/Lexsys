import axios from "axios";

type UserType = { 'username': string, 'password': string }

class Token {
    static async getTokenPair(user: UserType) {
        const getData = await axios.post(
            'http://18.231.0.182:8000/api/token/',
            user,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).catch(data => data);
        localStorage.setItem('acctoken', getData.data.access);
        localStorage.setItem('reftoken', getData.data.refresh);
    }

    static async _verifyToken(access: boolean) {
        const verifyData = await axios.post(
            'http://18.231.0.182:8000/api/token/verify/',
            {
                token: localStorage.getItem((access) ? 'acctoken' : 'reftoken')
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).catch(data => data);

        return verifyData.status == 200;
    }

    static verifyAccessToken() {
        return this._verifyToken(true).then(data => data);
    }

    static verifyRefreshToken() {
        return this._verifyToken(false).then(data => data);
    }

    static async refreshToken() {
        const data = {
            refresh: localStorage.getItem('reftoken')
        }


        const refreshData = await axios.post(
            'http://18.231.0.182:8000/api/token/refresh/',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).catch(data => data);

        localStorage.setItem('acctoken', refreshData.data.access);
    }

}

export default Token;