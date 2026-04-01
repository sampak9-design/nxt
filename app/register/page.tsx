import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import ZyroLogo from "@/components/ZyroLogo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff", color: "#111" }}>
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZyroLogo size={28} />
            <span className="text-xl font-bold text-orange-500">ZyroOption</span>
          </div>
          <Link href="/" className="px-6 py-2 border border-orange-500 text-orange-500 font-medium rounded hover:bg-orange-50 transition-colors text-sm">
            Entrar
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-semibold text-gray-800 text-center mb-8">Criar conta</h1>
            <RegisterForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já possui uma conta?{" "}
                <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">Entrar</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
