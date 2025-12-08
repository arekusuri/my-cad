import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

console.log('main.tsx executing...');

// Visual debug indicator
const div = document.createElement('div');
div.innerHTML = 'DEBUG: JS Running';
div.style.position = 'fixed';
div.style.top = '0';
div.style.left = '0';
div.style.background = 'red';
div.style.color = 'white';
div.style.padding = '5px';
div.style.zIndex = '10000';
document.body.appendChild(div);

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Failed to find the root element');
  div.innerHTML += ' - No Root!';
} else {
  try {
    const root = createRoot(rootElement);
    console.log('Root created, rendering...');
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log('Render called');
  } catch (e) {
    console.error('Error during render:', e);
    div.innerHTML += ' - Render Error: ' + String(e);
  }
}
