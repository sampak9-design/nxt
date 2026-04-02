"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/traderoom";
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input type="text" required className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
          <input type="text" required className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input type="email" required className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input type="tel" className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10 text-gray-900"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" required className="mt-1 accent-orange-500" id="terms" />
        <label htmlFor="terms" className="text-xs text-gray-600">
          Concordo com os <span className="text-orange-500 cursor-pointer">Termos de Uso</span> e <span className="text-orange-500 cursor-pointer">Política de Privacidade</span>
        </label>
      </div>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-colors disabled:opacity-60">
        {loading ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
