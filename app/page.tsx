import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gym Management
          </h1>
          <p className="text-gray-600 mb-8">
            Sistema de gestión para gimnasios
          </p>
          
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 block text-center"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register"
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 block text-center"
            >
              Registrar Gimnasio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}