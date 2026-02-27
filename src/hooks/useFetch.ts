import { useEffect, useRef } from 'react';

/**
 * Custom hook que ejecuta una función de fetch con AbortController y dependencias vacías.
 *
 * Usa useRef para funciones callback evitando suprimir exhaustive-deps.
 *
 * @param fetchFn Función async que recibe AbortSignal y retorna Promise<T>
 * @param onSuccess Callback que se ejecuta al completar exitosamente
 * @param onError Callback que se ejecuta si hay error (excluye AbortError)
 */
export const useFetch = <T,>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  onSuccess: (data: T) => void,
  onError?: (error: Error) => void
) => {
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Sync refs on each render
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchFnRef.current(controller.signal)
      .then((data) => {
        onSuccessRef.current(data);
      })
      .catch((error: Error) => {
        // Ignorar AbortError (cancelación intencional de requests)
        if (error.name !== 'AbortError') {
          onErrorRef.current?.(error);
        }
      });

    // Cleanup: cancelar requests en-flight
    return () => controller.abort();
  }, []);
};
