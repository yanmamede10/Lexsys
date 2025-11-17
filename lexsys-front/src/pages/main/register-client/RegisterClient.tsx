import { useEffect, useState, type FormEvent } from 'react';
import './RegisterClient.css';
import Select, { type OptionType } from '../../../components/select/Select';
import axios from 'axios';

import * as tags from '../../../data/tags.json';

interface RegisterClientProps {
    isActive: boolean;
    chooseIndex: React.Dispatch<React.SetStateAction<string>>;
}

const sexOptions = [
    {
        value: 'M',
        label: 'Masculino'
    },
    {
        value: 'F',
        label: 'Feminino'
    }
]

function RegisterClient({ isActive, chooseIndex }: RegisterClientProps) {
    const [personType, setPersonType] = useState("");
    const [fantasyName, setFantasyName] = useState("");
    const [fullName, setFullName] = useState("");
    const [CPF, setCPF] = useState("");
    const [CNPJ, setCNPJ] = useState("");
    const [RG, setRG] = useState("");
    const [razaoSocial, setRazaoSocial] = useState("");
    const [sex, setSex] = useState("");
    const [telephoneNumber, setTelephoneNumber] = useState("");
    const [cellphoneNumber, setCellphoneNumber] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [address, setAddress] = useState("");
    const [addressNumber, setAddressNumber] = useState("");
    const [addressComplement, setAddressComplement] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [email, setEmail] = useState("");

    const [cityOptions, setCityOptions] = useState<OptionType[]>([]);

    useEffect(() => {
        axios.get('http://18.231.0.182:8000/api/cidades',
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
            })
            .then(res => res.data)
            .then(data => {
                let options: OptionType[] = [];
                data.map((cidade: { id: number, nome: string, estado: { sigla: string } }) => {
                    options.push({
                        value: cidade.id.toString(),
                        label: `${cidade.nome} - ${cidade.estado.sigla}`
                    });
                })
                options.sort((a, b) => a.label.localeCompare(b.label));
                setCityOptions(options);
            });
    }, [])

    if (!isActive) {
        if (personType != "")
            setPersonType("");
        return <></>;
    }

    const isPJ = personType == "PJ";
    const isPF = personType == "PF";

    function buildData() {
        let basicData = {
            tipo: (isPJ) ? "J" : ((isPF) ? "F" : ""),
            empresa: 1,
            endereco: address,
            numero: addressNumber,
            endereco_complemento: addressComplement,
            cidade: +addressCity,
            email: email,
            telefone: telephoneNumber,
            celular: cellphoneNumber,
        }
        const data = (isPJ) ? {
            ...basicData,
            cnpj: CNPJ,
            razao_social: razaoSocial,
            nome_completo: fantasyName
        } : {
            ...basicData,
            cpf: CPF,
            rg: RG,
            sexo: sex,
            data_nascimento: birthdate,
            nome_completo: fullName
        }

        return data;
    }

    function registerClient(e: FormEvent) {
        e.preventDefault();

        const data = buildData();

        axios.post(
            'http://18.231.0.182:8000/api/clientes/',
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('acctoken')}`
                }
            }
        ).then(res => {
            if(res.status == 201) {
                chooseIndex(tags.page_index.DASHBOARD);
            }
        });
    }

    return (
        <div id="register-client-container">
            <h1>Cadastro de Cliente</h1>
            <span className="screen-line" />
            <form id="register-client-form" onSubmit={(e) => (async function () { await registerClient(e) })()} >
                <div className="form-line first-line">
                    <label className="sideways">
                        <input type="radio" name="person_type" value="PF" onChange={() => setPersonType("PF")} />
                        <span></span>
                        <p>Física</p>
                    </label>
                    <label className="sideways">
                        <input type="radio" name="person_type" value="PJ" onChange={() => setPersonType("PJ")} />
                        <span></span>
                        <p>Jurídica</p>
                    </label>
                </div>
                <div className="form-line">
                    <label className={(!isPF) ? 'hidden' : ''}>
                        Nome Completo
                        <input type="text" name="name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete='off' />
                    </label>
                    <label className={(!isPJ) ? 'hidden' : ''}>
                        Nome Fantasia
                        <input type="text" name="name" value={fantasyName} onChange={(e) => setFantasyName(e.target.value)} autoComplete='off' />
                    </label>
                </div>
                <div className="form-line">
                    <label className={(!isPJ) ? 'hidden' : ''}>
                        Razão Social
                        <input type="text" name="pj_name" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} autoComplete='off' />
                    </label>
                    <label className={(!isPJ) ? 'hidden' : ''}>
                        CNPJ
                        <input type="text" name="cnpj" value={CNPJ} onChange={(e) => setCNPJ(e.target.value)} />
                    </label>
                    <label className={(!isPF) ? 'hidden' : ''}>
                        CPF
                        <input type="text" name="cpf" value={CPF} onChange={(e) => setCPF(e.target.value)} />
                    </label>
                    <label className={(!isPF) ? 'hidden' : ''}>
                        RG
                        <input type="text" name="rg" value={RG} onChange={(e) => setRG(e.target.value)} />
                    </label>
                    <label className={(!isPF) ? 'hidden' : ''}>
                        Sexo
                        <Select options={sexOptions} onChange={(value) => {
                            setSex(value?.value || '');
                        }} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Telefone
                        <input type="tel" name="phone_num_telefone" value={telephoneNumber} onChange={(e) => setTelephoneNumber(e.target.value)} autoComplete='off' />
                    </label>
                    <label>
                        Celular
                        <input type="tel" name="phone_num_celular" value={cellphoneNumber} onChange={(e) => setCellphoneNumber(e.target.value)} autoComplete='off' />
                    </label>
                    <label className={(!isPF) ? 'hidden' : ''}>
                        Data de Nascimento
                        <input type="date" name="birthdate" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} autoComplete='off' />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        Endereço
                        <input type="text" name="address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete='off' />
                    </label>
                    <label>
                        Nº
                        <input type="text" name="address_number" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} autoComplete='off' />
                    </label>
                    <label>
                        Complemento
                        <input type="text" name="address_complement" value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} autoComplete='off' />
                    </label>
                    <label>
                        Cidade
                        <Select options={cityOptions} onChange={(value) => {
                            setAddressCity(value?.value || '');
                        }} />
                    </label>
                </div>
                <div className="form-line">
                    <label>
                        E-mail
                        <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='off' />
                    </label>
                </div>


                <input id="register-client-submit" type="submit" value="Cadastrar" />
            </form>
        </div>

    );
}

export default RegisterClient;
