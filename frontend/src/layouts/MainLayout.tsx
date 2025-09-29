import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingActionButton from '../components/FloatingActionButton';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <Header />
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
      <Footer />
      {isLoggedIn && <FloatingActionButton />}
    </div>
  );
}
