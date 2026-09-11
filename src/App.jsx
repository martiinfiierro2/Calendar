import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import './layout-fixes.css';

// App solo monta el router. La lógica de rutas vive en su propio módulo.
export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
