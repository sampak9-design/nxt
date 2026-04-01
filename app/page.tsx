import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { AlertCircle } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff", color: "#111" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZyroLogo size={30} />
            <span className="text-xl font-bold text-orange-500">ZyroOption</span>
          </div>
          <Link
            href="/register"
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded hover:bg-orange-600 transition-colors text-sm"
          >
            Registrar-se
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-8">Entrar</h1>
            <LoginForm />
            <div className="mt-6 text-center space-y-2">
              <Link
                href="/forgot-password"
                className="text-sm text-orange-500 hover:text-orange-600 block"
              >
                Esqueceu a senha?
              </Link>
              <p className="text-sm text-gray-600">
                Ainda não possui uma conta?{" "}
                <Link href="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                  Inscrever-se
                </Link>
              </p>
            </div>
          </div>

          {/* Risk warning */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-800 mb-1">AVISO DE RISCO:</p>
                <p className="leading-relaxed">
                  Os CFDs estão sujeitos a riscos semelhantes aos das ações. Alguns fundos
                  especializados negociados em bolsa podem estar sujeitos a riscos de mercado
                  adicionais. Negociações implicam risco, incluindo possível perda de capital.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ZyroLogo size={24} />
                <span className="text-xl font-bold text-orange-500">ZyroOption</span>
              </div>
              <p className="text-sm text-gray-500">© 2025 ZyroOption. Todos os direitos reservados.</p>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500 max-w-4xl mx-auto leading-relaxed">
            <p className="mb-3">
              <strong className="text-gray-700">AVISO DE RISCO:</strong>
            </p>
            <p className="mb-3">
              A ZyroOption fornece seus serviços exclusivamente em territórios em que é licenciada.
              A ZyroOption não está autorizada pela Comissão de Valores Mobiliários (&quot;CVM&quot;)
              a diferença diretamente dos tipos de distribuição de valores mobiliários ou
              investidores residentes no Brasil.
            </p>
            <p>
              Você tem direitos não-exclusivos e não transferíveis ao uso pessoal e não-comercial
              do IP disponibilizado por este site apenas em relação aos serviços oferecidos no
              próprio site.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
