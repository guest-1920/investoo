import './Logo.css';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'light' | 'dark' | 'primary';
}

export function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
    return (
        <div className={`Investoo-logo Investoo-logo--${size} Investoo-logo--${variant}`}>
            <div className="Investoo-logo__icon">
                <div className="Investoo-logo__circle"></div>
            </div>
            <span className="Investoo-logo__text">Investoo</span>
        </div>
    );
}
