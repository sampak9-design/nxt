import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff", color: "#111" }}>
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-orange-500">XD Broker</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-2">Recuperar senha</h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              Informe seu e-mail para receber as instruções de recuperação.
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-colors"
              >
                Enviar instruções
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-orange-500 hover:text-orange-600">
                Voltar ao login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
