// src/pages/Home.jsx - Simple Landing Page
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Welcome to Farm Direct
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Connect directly with local farmers for fresh, quality produce
      </p>
      
      <div className="space-x-4">
        {currentUser ? (
          <Button asChild size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/products">Browse Products</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
