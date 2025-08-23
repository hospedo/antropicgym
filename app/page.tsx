import Link from 'next/link'
import { CheckCircle, Users, BarChart3, Bot, Zap, Star, Menu, X, Gauge } from 'lucide-react'
import SpeedometerLogo from '@/components/speedometer-logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SpeedometerLogo size="md" showText={true} />
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
      <section className="bg-gradient-to-br from-red-600 via-black to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Tu gym, de
                <span className="block text-yellow-300">0 a 100</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-red-100">
                Gestión simple, resultados al 100. Transforma tu gimnasio desde cero hasta el máximo rendimiento.
                <span className="block text-sm mt-2 text-yellow-200">🏔️ Made in Calamuchita</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/auth/register"
                  className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition duration-200 shadow-lg"
                >
                  Prueba Gratuita - 30 días
                </Link>
                <Link
                  href="/auth/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-red-600 transition duration-200"
                >
                  Ver Demo
                </Link>
              </div>
              <p className="text-red-200 mt-4 text-sm text-center lg:text-left">
                ✅ Sin tarjeta de crédito • ✅ De la gestión al máximo rendimiento • ✅ Luego $150 por usuario/mes
              </p>
            </div>
            
            {/* Imagen Hero */}
            <div className="relative">
              <img 
                src="/hero-antropic.png" 
                alt="De0a100 - Tu gym de 0 a 100" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="flex items-center justify-center gap-3">
                <Gauge className="h-10 w-10 text-red-600" />
                De 0 a 100: Todo lo que necesitas
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Arranca desde cero y escala hasta el máximo rendimiento. 
              Cada herramienta diseñada para el crecimiento de tu gimnasio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">AI Coach Viral</h3>
                <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">0→100</span>
              </div>
              <p className="text-gray-600 mb-4">
                De cero seguidores a contenido viral. IA que transforma tu presencia digital al máximo.
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Gestión Completa</h3>
                <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">0→100</span>
              </div>
              <p className="text-gray-600 mb-4">
                Del caos administrativo al orden total. Sistema que escala contigo hasta el máximo control.
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Analytics Avanzados</h3>
                <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">0→100</span>
              </div>
              <p className="text-gray-600 mb-4">
                De datos básicos a inteligencia empresarial. Insights que maximizan tu crecimiento.
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
              Resultados al 100%: Transformación garantizada
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Gimnasios que llegaron al máximo con De0a100
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-5xl font-bold text-red-600 mb-2 flex items-center justify-center">
                0→40%
              </div>
              <p className="text-gray-600">Aumento en retención</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-red-600 h-2 rounded-full" style={{width: '40%'}}></div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-5xl font-bold text-blue-600 mb-2 flex items-center justify-center">
                0→3x
              </div>
              <p className="text-gray-600">Más engagement</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="text-5xl font-bold text-green-600 mb-2 flex items-center justify-center">
                0→60%
              </div>
              <p className="text-gray-600">Menos tiempo admin</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Precios simples y transparentes
            </h2>
            <p className="text-xl text-gray-600">
              Sin costos ocultos, sin permanencia. Cancela cuando quieras.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-8 text-center relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                🚀 Más Popular
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Plan Completo</h3>
            
            <div className="mb-6">
              <div className="text-center">
                <span className="text-5xl font-bold text-red-600">$150</span>
                <span className="text-gray-600 ml-2">/usuario/mes</span>
              </div>
              <p className="text-green-600 font-semibold mt-2">
                ✨ 30 días gratis para probar
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 text-left">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>AI Coach Viral ilimitado</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Gestión completa de clientes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Control de asistencias</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Gestión de pagos</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Analytics avanzados</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Soporte prioritario</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span>Integración WhatsApp</span>
              </li>
            </ul>
            
            <Link
              href="/auth/register"
              className="w-full bg-red-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:bg-red-700 transition duration-200 inline-block"
            >
              Comenzar Prueba Gratuita
            </Link>
            
            <p className="text-sm text-gray-500 mt-4">
              Sin tarjeta de crédito requerida • Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comienza a transformar tu gimnasio hoy
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Únete a los gimnasios que ya están creciendo con De0a100
          </p>
          <Link
            href="/auth/register"
            className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition duration-200 shadow-lg inline-block"
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
              <h3 className="text-2xl font-bold mb-4">De0a100</h3>
              <p className="text-gray-400 mb-4">
                Tu gym, de 0 a 100. Gestión simple, resultados al máximo rendimiento.
              </p>
              <p className="text-sm text-gray-500">
                🏔️ Made in Calamuchita con ❤️
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
            <p>&copy; 2024 De0a100. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}