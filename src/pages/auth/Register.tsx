import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Llamar al API de registro
      await register(formData.username, formData.email, formData.password);

      // Redirigir al dashboard después del registro exitoso
      navigate('/tickets', { replace: true });
    } catch (err: unknown) {
      console.error('Register error:', err);
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          setError('El usuario o el correo ya están registrados.');
        } else if (err.response?.data?.errors?.[0]?.detail) {
          setError(err.response.data.errors[0].detail);
        } else {
          setError('Ocurrió un error al crear la cuenta. Intenta nuevamente.');
        }
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Error al crear la cuenta. Intenta nuevamente.');
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
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <div className="auth-icon auth-icon-register">
            <UserPlus size={32} />
          </div>
          <h1 className="auth-title">Crear cuenta en TicketSystem</h1>
          <p className="auth-subtitle">Completa tus datos para registrarte</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="usuario123"
                minLength={3}
                required
              />
              <span className="form-hint">Mínimo 3 caracteres</span>
            </div>

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
          </div>

          <div className="form-row">
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
                minLength={8}
                required
              />
              <span className="form-hint">Mínimo 8 caracteres, 1 mayúscula y 1 símbolo</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {' '}Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>

          <div className="auth-divider">
            <span>¿Ya tienes cuenta?</span>
          </div>

          <Link to="/login" className="btn-secondary">
            Iniciar sesión
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

export default Register;
