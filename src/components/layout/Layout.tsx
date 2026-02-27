import { useLocation, useMatch } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar/NavBar';
import SSEGlobalListener from './SSEGlobalListener.tsx';

/**
 * Layout wrapper that conditionally renders:
 * - The Navbar (hidden on auth pages)
 * - The SSE global listener (active only on authenticated routes
 *   that are NOT TicketDetail, which has its own SSE connection)
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isTicketDetail = Boolean(useMatch('/tickets/:id'));
  const { isAuthenticated } = useAuth();
  const showProtectedUI = !isAuthPage && isAuthenticated;

  return (
    <>
      {showProtectedUI && <Navbar />}
      {showProtectedUI && !isTicketDetail && <SSEGlobalListener />}
      {children}
    </>
  );
};

export default Layout;
