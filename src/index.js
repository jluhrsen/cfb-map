import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GameDataProvider } from './contexts/GameDataContext';
import { FilterProvider } from './contexts/FilterContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GameDataProvider>
      <FilterProvider>
        <App />
      </FilterProvider>
    </GameDataProvider>
  </React.StrictMode>
);

reportWebVitals();
