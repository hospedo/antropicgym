import Link from 'next/link'
import { CheckCircle, Users, BarChart3, Bot, Zap, Star, Menu, X, Gauge } from 'lucide-react'
import SpeedometerLogo from '@/components/speedometer-logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black scroll-smooth" style={{scrollSnapType: 'y mandatory'}}>
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

      {/* Multi-Hero: 3 Problemas Específicos */}
      
      {/* Hero 1: PROBLEMA - Control de Asistencias */}
      <section className="relative h-screen overflow-hidden" style={{scrollSnapAlign: 'start'}}>
        {/* Video de fondo */}
        <div className="absolute inset-0">
          <video 
            className="w-full h-full object-cover scale-105 animate-pulse"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/enojado.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradiente cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-black/60 to-black/90"></div>
        </div>
        
        {/* Contenido overlay estilo TikTok */}
        <div className="relative z-10 h-screen flex flex-col justify-center px-6">
          {/* Badge flotante */}
          <div className="animate-bounce mb-8">
            <span className="inline-block bg-red-500 text-white px-8 py-4 rounded-full text-xl font-black shadow-2xl border-4 border-white">
              😤 PROBLEMA #1
            </span>
          </div>
          
          {/* Título masivo */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none text-white drop-shadow-2xl">
            "No sé quién vino<br/>
            <span className="text-red-400">hoy al gym</span>"
          </h1>
          
          {/* Subtítulo impactante */}
          <p className="text-3xl md:text-4xl mb-12 text-red-100 font-bold drop-shadow-xl">
            No anotan nada. Pierdo el control total.
          </p>
          
          {/* CTA gigante */}
          <Link
            href="/auth/register"
            className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-16 py-8 rounded-2xl text-3xl font-black hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-110 shadow-2xl border-4 border-white animate-pulse max-w-fit"
          >
            ✨ SOLUCIONAR AHORA
          </Link>
          
          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-ping"></div>
            </div>
            <p className="text-white text-sm mt-2 text-center">Scroll ↓</p>
          </div>
        </div>
      </section>

      {/* Hero 2: PROBLEMA - Cobros Desorganizados */}
      <section className="relative h-screen overflow-hidden" style={{scrollSnapAlign: 'start'}}>
        {/* Video de fondo */}
        <div className="absolute inset-0">
          <video 
            className="w-full h-full object-cover scale-110 animate-slow-zoom"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/box.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradiente cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/30 via-black/70 to-black/90"></div>
        </div>
        
        {/* Contenido overlay estilo TikTok */}
        <div className="relative z-10 h-screen flex flex-col justify-center px-6">
          {/* Badge flotante */}
          <div className="animate-pulse mb-8">
            <span className="inline-block bg-orange-500 text-white px-8 py-4 rounded-full text-xl font-black shadow-2xl border-4 border-white">
              💸 PROBLEMA #2
            </span>
          </div>
          
          {/* Título masivo */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none text-white drop-shadow-2xl">
            "¿Quién me<br/>
            <span className="text-orange-400">debe plata?</span>"
          </h1>
          
          {/* Subtítulo impactante */}
          <p className="text-3xl md:text-4xl mb-12 text-orange-100 font-bold drop-shadow-xl">
            $50K perdidos en cobros desorganizados
          </p>
          
          {/* CTA gigante */}
          <Link
            href="/auth/register"
            className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-16 py-8 rounded-2xl text-3xl font-black hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 transform hover:scale-110 shadow-2xl border-4 border-white animate-bounce max-w-fit"
          >
            💰 ORGANIZAR TODO
          </Link>
          
          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-orange-400 rounded-full mt-2 animate-ping"></div>
            </div>
            <p className="text-white text-sm mt-2 text-center">Seguí leyendo ↓</p>
          </div>
        </div>
      </section>

      {/* Hero 3: PROBLEMA - Marketing Inexistente */}
      <section className="relative h-screen overflow-hidden" style={{scrollSnapAlign: 'start'}}>
        {/* Video de fondo */}
        <div className="absolute inset-0">
          <video 
            className="w-full h-full object-cover scale-105 animate-ken-burns"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/solucion.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradiente cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black/60 to-black/95"></div>
        </div>
        
        {/* Contenido overlay estilo TikTok */}
        <div className="relative z-10 h-screen flex flex-col justify-center px-6">
          {/* Badge flotante */}
          <div className="animate-spin-slow mb-8">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-black shadow-2xl border-4 border-white">
              📱 PROBLEMA #3
            </span>
          </div>
          
          {/* Título masivo */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none text-white drop-shadow-2xl">
            "¿Cómo atraigo<br/>
            <span className="text-purple-400">clientes?</span>"
          </h1>
          
          {/* Subtítulo impactante */}
          <p className="text-3xl md:text-4xl mb-12 text-purple-100 font-bold drop-shadow-xl">
            Instagram muerto hace 6 meses
          </p>
          
          {/* CTA gigante */}
          <Link
            href="/auth/register"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-16 py-8 rounded-2xl text-3xl font-black hover:from-pink-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-110 shadow-2xl border-4 border-white animate-pulse max-w-fit"
          >
            🚀 MARKETING AUTOMÁTICO
          </Link>
          
          {/* Indicador de scroll final */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-purple-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-purple-400 rounded-full mt-2 animate-ping"></div>
            </div>
            <p className="text-purple-200 text-sm mt-2 text-center font-bold">¡La solución! ↓</p>
          </div>
        </div>
      </section>

      {/* Hero SOLUCIÓN: De0a100 lo resuelve TODO */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              ¡Adiós a todos<br/>
              <span className="text-gray-300">tus problemas!</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
              Sistema completo que automatiza tu gimnasio en <strong>24 horas</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Plan GRATIS */}
            <div className="bg-gray-900 p-8 rounded-3xl border-4 border-gray-600">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🆓</div>
                <h3 className="text-3xl font-black text-white">VERSIÓN GRATIS</h3>
                <p className="text-lg text-gray-300 mt-2">Sin IA • Para siempre</p>
              </div>
              <ul className="space-y-4 text-lg mb-8">
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Control de asistencias</strong> (DNI automático)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Gestión de pagos</strong> (alertas y historial)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Dashboard básico</strong> (reportes simples)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Soporte comunidad</strong></span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="w-full bg-white text-black py-6 px-8 rounded-2xl text-2xl font-black hover:bg-gray-200 transition duration-300 transform hover:scale-105 shadow-2xl text-center block"
              >
                🚀 EMPEZAR GRATIS
              </Link>
            </div>

            {/* Plan PREMIUM */}
            <div className="bg-gray-800 p-8 rounded-3xl border-4 border-gray-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-black px-6 py-2 rounded-full text-lg font-bold">
                  🔥 MÁS POPULAR
                </span>
              </div>
              <div className="text-center mb-6 pt-4">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-3xl font-black text-white">VERSIÓN CON IA</h3>
                <p className="text-lg text-gray-300 mt-2">Todo lo anterior + IA</p>
              </div>
              <ul className="space-y-4 text-lg mb-8">
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Todo del plan gratis</strong></span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>IA Coach Viral</strong> (contenido automático)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Marketing automático</strong> (posts, stories)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>WhatsApp integrado</strong></span>
                </li>
                <li className="flex items-center">
                  <span className="text-white mr-3 text-2xl">✓</span>
                  <span><strong>Soporte prioritario</strong></span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="w-full bg-white text-black py-6 px-8 rounded-2xl text-2xl font-black hover:bg-gray-200 transition duration-300 transform hover:scale-105 shadow-2xl text-center block mb-4"
              >
                🎯 PLAN COMPLETO
              </Link>
              <p className="text-center text-gray-300 text-lg">
                <strong>$150/mes</strong> después de 30 días gratis
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-3xl mx-auto border border-gray-600">
              <h3 className="text-3xl font-bold mb-4">⚡ ¡Configúralo en 5 minutos!</h3>
              <p className="text-xl mb-6">
                Empieza gratis. Actualiza cuando quieras. Cancela cuando quieras.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center text-lg">
                <div>
                  <div className="text-2xl font-bold text-white">✓</div>
                  <div>Sin tarjeta</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">✓</div>
                  <div>Setup rápido</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">✓</div>
                  <div>Migración fácil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer Minimalista */}
      <footer className="bg-black text-white py-8">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2024 DE0A100 • Made in Calamuchita 🏔️
          </p>
        </div>
      </footer>
    </div>
  )
}