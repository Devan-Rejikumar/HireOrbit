import RegisterForm from '@/components/RegisterForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Hire Orbit</h1>
          <p className="text-gray-600">Join thousands of professionals and companies</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default Index;