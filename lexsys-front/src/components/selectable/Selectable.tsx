import './Selectable.css';

// Typing
import type { ChangeEventHandler } from 'react';

interface SelectableProps {
    onChange: ChangeEventHandler<HTMLInputElement>;
    checked: boolean;
    text: string;
    type: 'radio' | 'checkbox';
}

function Selectable(props: SelectableProps) {
    return (
        <label className="selectable">
            <input type={props.type} checked={props.checked} onChange={props.onChange} />
            <div className="span-container">
                <span />
            </div>
            <p>{props.text}</p>
        </label>
    )
}

export default Selectable;