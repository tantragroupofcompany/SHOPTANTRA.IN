import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import AIChatbot from '../components/AIChatbot';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AIChatbot />
    </div>
  );
}

