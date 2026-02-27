import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon">
          <AlertTriangle size={48} />
        </div>
        <h1 className="not-found-title">404</h1>
        <p className="not-found-subtitle">Página no encontrada</p>
        <p className="not-found-description">
          La página que buscas no existe o ha sido movida.
        </p>
        <button
          className="not-found-button"
          onClick={() => navigate('/tickets', { replace: true })}
        >
          <Home size={18} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound;
