import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [message]);

    return (
        <div
            role="status"
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1f2937',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '8px',
                zIndex: 1000,
            }}
        >
            {message}
        </div>
    );
}