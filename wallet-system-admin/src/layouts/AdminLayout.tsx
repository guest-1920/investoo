import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import './AdminLayout.css';

export function AdminLayout() {
    return (
        <div className="admin-layout">
            <Sidebar />
            <Header />
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
