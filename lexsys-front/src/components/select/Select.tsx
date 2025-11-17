import "./Select.css";
import ReactSelect, { type SingleValue, type ActionMeta } from 'react-select';
// import { type ControlProps, type ContainerProps, type GroupBase } from 'react-select';

type OptionType = { value: string, label: string };
// type ControlStateType = ControlProps<OptionType, false, GroupBase<OptionType>>;
// type ContainerStateType = ContainerProps<OptionType, false, GroupBase<OptionType>>;

type SelectProps = {
    options: OptionType[];
    onChange: (newValue: SingleValue<OptionType>, actionMeta: ActionMeta<OptionType>) => void;
    isSearchable?: boolean;
    isLoading?: boolean;
}

const controlStyles = () => {
    return {
        padding: '2px',
        margin: '0',
        borderRadius: '4px',
        borderColor: 'var(--main)',
        outline: 'none',
        ":hover": {
            borderColor: 'var(--main)',
            outline: '1px solid var(--main)'
        },
        height: '100%',
        width: '100%',
        display: 'flex',
        flex: '1',
        boxShadow: '0'
    }
}

const containerStyles = () => {
    return {
        padding: '0',
        margin: '0',
        display: 'flex',
        flex: '1',
        width: '100%'
    }
}
function Select(props: SelectProps) {
    return <ReactSelect
        options={props.options}
        onChange={props.onChange}
        isSearchable={props.isSearchable}
        isLoading={props.isLoading}
        placeholder="Selecione..."
        noOptionsMessage={() => 'Não há opções'}
        styles={{
            container: (baseStyles) => ({
                ...baseStyles,
                ...containerStyles()
            }),
            control: (baseStyles) => ({
                ...baseStyles,
                ...controlStyles()
            })
        }} />;
}

export default Select;

export type {OptionType};