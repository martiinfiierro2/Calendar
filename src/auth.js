// Mantengo estos nombres para no romper imports antiguos mientras la app usa el servicio nuevo.
export {
  getSession as obtenerSesion,
  hasSession as haySesion,
  registerUser as registrarUsuario,
  loginUser as iniciarSesion,
  logoutUser as cerrarSesion
} from './services/authService';
