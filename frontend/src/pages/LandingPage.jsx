import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse, Zap, ChevronRight, Stethoscope, BarChart3, Baby } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">Dr<span className="text-teal-600">.</span>Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                Acceso Médicos
              </Link>
              <Link to="/login" className="group relative px-5 py-2.5 font-semibold text-white bg-gray-900 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-sm">
                <span className="relative z-10 flex items-center gap-2">
                  Empezar <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-teal-600 to-teal-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-teal-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-8 border border-teal-100/50">
            <Zap className="w-4 h-4" /> Velocidad y Eficiencia Redefinidas
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 max-w-4xl mx-auto leading-[1.1]">
            El estándar de platino para <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">clínicas de alto rendimiento.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Elimina la fricción de tu consulta. Expedientes hiper-rápidos, curvas de la OMS integradas y visualizadores anatómicos 3D, diseñados para médicos que exigen lo mejor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login" className="px-8 py-4 text-base font-semibold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-xl shadow-teal-600/30 transition-all hover:-translate-y-1 w-full sm:w-auto">
              Acceder a la Plataforma
            </Link>
            <a href="#features" className="px-8 py-4 text-base font-semibold text-gray-900 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto">
              Descubrir Funciones
            </a>
          </div>

          {/* Hero Image / Mockup Generator Area */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-[2.5rem] blur opacity-20"></div>
            <div className="relative rounded-t-[2rem] border border-gray-200/60 bg-white/50 backdrop-blur-sm p-2 shadow-2xl">
              <img 
                src="/hero_medical_dashboard.png" 
                alt="Medical Dashboard Preview" 
                className="rounded-[1.5rem] w-full object-cover border border-gray-100 shadow-sm"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Diseñado para no hacerte perder un segundo.
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Cada milisegundo cuenta cuando tienes una sala de espera llena. Nuestra arquitectura asegura cargas instantáneas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-teal-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Rendimiento Extremo</h3>
              <p className="text-gray-500 leading-relaxed">
                App optimizada mediante Code-Splitting. Solo se carga lo que necesitas, haciendo que navegar entre expedientes sea instantáneo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Curvas WHO de Precisión</h3>
              <p className="text-gray-500 leading-relaxed">
                Seguimiento visual exacto del desarrollo infantil mediante integraciones nativas de los estándares de crecimiento de la OMS.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                <Baby className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Visor Pediátrico 3D</h3>
              <p className="text-gray-500 leading-relaxed">
                Navega y anota condiciones sobre siluetas tridimensionales fluidas. La historia clínica del futuro, hoy en tu consultorio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-teal-900"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-gray-900"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Stethoscope className="w-16 h-16 text-teal-400 mx-auto mb-8 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Lleva tu clínica al siguiente nivel tecnológico.
          </h2>
          <p className="text-teal-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Únete a médicos liderando la vanguardia en atención al paciente. Menos tiempo documentando, más tiempo diagnosticando.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-teal-900 bg-white rounded-full hover:bg-gray-100 shadow-2xl transition-all hover:scale-105 active:scale-95">
            Solicitar Acceso Hoy
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-gray-900">Dr.Platform</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Soluciones Médicas Avanzadas. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
