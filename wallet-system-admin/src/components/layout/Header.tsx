import './Header.css';

export function Header() {
    return (
        <header className="header">
            <div className="header-title">
                {/* Page title could be dynamic based on route */}
            </div>
            <div className="header-actions">
                {/* Additional header actions can be added here */}
            </div>
        </header>
    );
}

export default Header;
