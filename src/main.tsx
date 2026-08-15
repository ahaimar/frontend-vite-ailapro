import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './style.scss'
import './components/ui/style_2.scss'
import App from './App.tsx'
import {QueryClientProvider, QueryClient} from "@tanstack/react-query";
import {BrowserRouter} from 'react-router';

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App/>
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
)
