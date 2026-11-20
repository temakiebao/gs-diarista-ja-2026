import Link from "next/link";
import { ShieldCheck, UserPlus, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center px-6 py-12">
      <div className="grid w-full items-center gap-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12]">
            Cadastre seu perfil profissional e receba clientes pelo aplicativo.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Crie sua conta em poucos minutos, informe seus serviços, bairro de
            atendimento e valor por hora. Assim que seu cadastro for aprovado pela
            administração, ele aparece automaticamente nas buscas do app.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#256D47] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e5839]"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar como Profissional
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4 text-[#256D47]" />
              Acesso Administrativo
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Fluxo de Cadastro e Publicação
              </h2>
            </div>
            <div className="mt-6 space-y-6">
              {/* Etapa 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[#256D47]">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cadastro no Portal Web
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Preencha seus dados pessoais, serviços oferecidos, região de
                    atendimento e valor por hora.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Análise Administrativa
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    A solicitação fica visível apenas para o administrador revisar
                    experiência, região e serviços.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#256D47]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Publicação no App
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Com a aprovação, o aplicativo mobile passa a exibir o perfil
                    automaticamente para os clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}