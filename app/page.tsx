import Link from 'next/link'
import { CheckCircle, Users, BarChart3, Bot, Zap, Star, Menu, X } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-purple-600">ANTROPIC</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition duration-200"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gestiona tu gimnasio con
              <span className="block text-yellow-300">Inteligencia Artificial</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              La plataforma completa para transformar tu gimnasio en un negocio próspero. 
              Con AI Coach viral, gestión inteligente y herramientas avanzadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition duration-200 shadow-lg"
              >
                Prueba Gratuita - 30 días
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition duration-200"
              >
                Ver Demo
              </Link>
            </div>
            <p className="text-purple-200 mt-4 text-sm">
              ✅ Sin tarjeta de crédito • ✅ Configuración en 5 minutos • ✅ Soporte incluido
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para hacer crecer tu gimnasio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde la gestión básica hasta inteligencia artificial avanzada, 
              tenemos todas las herramientas que tu gimnasio necesita.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Coach Viral</h3>
              <p className="text-gray-600 mb-4">
                Genera contenido automático para redes sociales que mantiene a tus clientes motivados y atrae nuevos miembros.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Contenido personalizado por IA
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Detección automática de logros
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Integración con WhatsApp
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión Completa</h3>
              <p className="text-gray-600 mb-4">
                Administra clientes, planes, pagos y asistencias desde una plataforma centralizada e intuitiva.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Registro de clientes y planes
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Control de asistencias
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Gestión de pagos
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analytics Avanzados</h3>
              <p className="text-gray-600 mb-4">
                Obtén insights valiosos sobre el rendimiento de tu gimnasio y toma decisiones basadas en datos.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Reportes de asistencia
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Análisis de retención
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Métricas de crecimiento
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Resultados que transforman gimnasios
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-purple-600 mb-2">40%</div>
              <p className="text-gray-600">Aumento en retención de clientes</p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-gray-600">Más engagement en redes sociales</p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-green-600 mb-2">60%</div>
              <p className="text-gray-600">Reducción en tiempo administrativo</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comienza a transformar tu gimnasio hoy
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Únete a los gimnasios que ya están creciendo con ANTROPIC
          </p>
          <Link
            href="/auth/register"
            className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-300 transition duration-200 shadow-lg inline-block"
          >
            Iniciar Prueba Gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">ANTROPIC</h3>
              <p className="text-gray-400 mb-4">
                La plataforma de gestión de gimnasios más avanzada, 
                potenciada por inteligencia artificial.
              </p>
              <p className="text-sm text-gray-500">
                🌟 Creado con ❤️ por el <strong>Colectivo Digital del Valle de Calamuchita</strong>
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/register" className="hover:text-white">Características</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Demo</Link></li>
                <li><Link href="/auth/register" className="hover:text-white">Precios</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/login" className="hover:text-white">Ayuda</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Contacto</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Documentación</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ANTROPIC. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}