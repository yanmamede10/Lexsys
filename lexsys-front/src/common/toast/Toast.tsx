import './Toast.css';

interface ToastProps {
    text: string,
    type: string,
    show: boolean
}

function Toast(props:ToastProps) {
    return <span id={'toast-container ' + props.type + ' ' + (props.show) ? 'show' : ''}>{props.text}</span>;
}

export default Toast;