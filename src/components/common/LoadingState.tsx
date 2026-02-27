interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = 'Cargando...' }: LoadingStateProps) => {
  return (
    <div className="status-container">
      <div className="spinner" />
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingState;
