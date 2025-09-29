import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingActionButton from '../components/FloatingActionButton';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <Header />
      <main>
        <Container fluid className="px-4" style={{ marginTop: '2rem', maxWidth: '80%', margin: '2rem auto' }}>
          <Outlet />
        </Container>
      </main>
      <Footer />
      {isLoggedIn && <FloatingActionButton />}
    </div>
  );
}
