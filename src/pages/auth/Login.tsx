import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamar al API de autenticación
      await login(formData.email, formData.password);
      
      // Redirigir al dashboard después del login exitoso
      navigate('/tickets', { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('El usuario y/o contraseña son incorrectos.');
        } else if (err.response?.data?.errors?.[0]?.detail) {
          setError(err.response.data.errors[0].detail);
        } else {
          setError('Ocurrió un error al iniciar sesión. Intenta nuevamente.');
        }
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={32} />
          </div>
          <h1 className="auth-title">Bienvenido a TicketSystem</h1>
          <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

    
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {' '}Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <div className="auth-divider">
            <span>¿No tienes cuenta?</span>
          </div>

          <Link to="/register" className="btn-secondary">
            Crear cuenta nueva
          </Link>
        </form>
      </div>

      <div className="auth-background">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
        <div className="auth-blob auth-blob-3"></div>
      </div>
    </div>
  );
};

export default Login;
