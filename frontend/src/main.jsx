import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

// 🌐 DYNAMIC FIX: Automatically uses Render url when live, and localhost when developing
export const serverUrl = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://vingo-food-delivery-backend-tbhw.onrender.com";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
)
