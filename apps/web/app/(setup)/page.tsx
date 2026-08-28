// @polsia:user-owned — landing page served at /. Replace its content in place;
/** biome-ignore-all assist/source/useSortedAttributes: <> */
/** biome-ignore-all assist/source/useSortedKeys: <> */
// keep this a Server Component so it can export metadata.

import {
  ArrowRight,
  Check,
  ClipboardList,
  Lock,
  MessagesSquare,
  Phone,
  Scale,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq, type FaqEntry } from '@/components/custom/faq';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { siteDescription, siteName } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: siteName },
  description: siteDescription,
  // Do not export an explicit openGraph object here; that suppresses the
  // file-based opengraph-image.tsx for the home route.
  alternates: { canonical: '/' },
};

const CONTACT_EMAIL = 'tervox@polsia.app';

const flowSteps: ReadonlyArray<{ n: string; title: string; body: string }> = [
  {
    n: '01',
    title: 'Lead chega ao WhatsApp do escritório',
    body: 'Quando alguém escreve no número do escritório, o agente de IA do Tervox assume a conversa em segundos — sem fila, sem mensagem automática fria.',
  },
  {
    n: '02',
    title: 'Roteiro de triagem da área do direito',
    body: 'O escritório define, por área de atuação, quais perguntas precisam de resposta. O agente segue o roteiro configurado pelo próprio time jurídico — não um formulário genérico.',
  },
  {
    n: '03',
    title: 'Coleta estruturada e validada',
    body: 'Nome, contato, contexto do caso, documentos disponíveis e nível de urgência chegam preenchidos e padronizados. Áudios longos, prints soltos e cronologias em texto livre viram ficha limpa.',
  },
  {
    n: '04',
    title: 'Prontuário consultável, isolado por tenant',
    body: 'Cada escritório opera em ambiente isolado, com dados segregados. A ficha fica disponível em um painel web enxuto, construído em Next.js, pronto para consulta e anotação interna.',
  },
  {
    n: '05',
    title: 'Advogado decide os próximos passos',
    body: 'Nenhuma ação jurídica é tomada sem revisão humana — em linha com as diretrizes da OAB sobre uso de inteligência artificial no atendimento. O Tervox entrega a triagem; o advogado entrega o aconselhamento.',
  },
];

const features: ReadonlyArray<{ icon: typeof Sparkles; title: string; body: string }> = [
  {
    icon: ClipboardList,
    title: 'Prontuário estruturado',
    body: 'Respostas, contexto e documentos viram uma ficha única, validada e fácil de consultar — em vez de uma conversa de 60 mensagens espalhada por áudios.',
  },
  {
    icon: MessagesSquare,
    title: 'Integração com WhatsApp Business API',
    body: 'Conexão nativa ao canal onde o lead realmente está. O escritório recebe a triagem pronta; o lead só percebe que foi atendido rápido.',
  },
  {
    icon: ShieldCheck,
    title: 'Dados segregados por tenant',
    body: 'Cada escritório opera em ambiente isolado, com controle de acesso por equipe, em conformidade com a LGPD para escritórios de advocacia.',
  },
  {
    icon: Scale,
    title: 'Roteiros por área do direito',
    body: 'Trabalhista, cível, família, tributário, consumidor, criminal — cada área usa o seu próprio script de perguntas, validado pelo time do escritório.',
  },
  {
    icon: Lock,
    title: 'Revisão humana em toda a jornada',
    body: 'O agente de IA conduz a coleta; o advogado ou colaborador sempre decide. Nenhuma peça é gerada ou encaminhada sem que um humano revise.',
  },
  {
    icon: Sparkles,
    title: 'Construído para a próxima fase',
    body: 'Node.js com Fastify, TypeScript, Zod, PostgreSQL e Drizzle ORM no backend. O prontuário estruturado alimenta, já no horizonte, a geração assistida de minutas e peças iniciais.',
  },
];

const areas: readonly string[] = [
  'Trabalhista',
  'Cível',
  'Família e sucessões',
  'Tributário',
  'Consumidor',
  'Empresarial',
  'Previdenciário',
  'Criminal',
  'Imobiliário',
  'Administrativo',
  'Saúde e planos',
  'Contratos',
];

const compliancePoints: ReadonlyArray<{
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}> = [
  {
    icon: Scale,
    title: 'Resolução OAB sobre IA no atendimento jurídico',
    body: 'O Tervox foi desenhado para conduzir apenas a triagem inicial. Nenhuma orientação, aconselhamento ou peça é gerada sem revisão de um advogado habilitado.',
  },
  {
    icon: Lock,
    title: 'LGPD para escritórios de advocacia',
    body: 'Dados segregados por tenant, com controle de acesso por equipe. Apenas pessoas autorizadas veem fichas de leads e clientes do seu escritório.',
  },
  {
    icon: Users,
    title: 'Decisão sempre humana',
    body: 'O prontuário sai pronto para o advogado decidir. A IA retira o trabalho repetitivo de coleta; o julgamento jurídico continua sendo humano.',
  },
];

const faqItems: readonly FaqEntry[] = [
  {
    question: 'O Tervox substitui o advogado?',
    answer:
      'Não. O Tervox automatiza a triagem inicial — perguntas estruturadas, coleta padronizada de documentos e prontuário consultável. Toda decisão jurídica continua sendo tomada por um profissional habilitado, em linha com a Resolução da OAB sobre uso de IA no atendimento.',
  },
  {
    question: 'Como funciona a integração com o WhatsApp?',
    answer:
      'O Tervox conecta-se ao WhatsApp Business API do escritório. Quando um lead escreve, o agente assume a conversa em segundos, segue o roteiro configurado para a área do direito em questão e entrega a ficha para o time jurídico revisar.',
  },
  {
    question: 'Os dados dos meus clientes ficam isolados?',
    answer:
      'Sim. Cada escritório opera em um ambiente isolado, com dados segregados por tenant. Apenas pessoas autorizadas do seu escritório acessam as fichas — nunca outros escritórios e nunca o time do Tervox sem consentimento.',
  },
  {
    question: 'Posso configurar as perguntas por área do direito?',
    answer:
      'Sim. Você define, por área de atuação, quais perguntas precisam de resposta, qual o nível mínimo de informação aceito e como classificar urgência. O roteiro é do seu escritório, não um formulário genérico.',
  },
  {
    question: 'O que o Tervox entrega no MVP?',
    answer:
      'Integração com a WhatsApp Business API, agente de IA conversacional seguindo o roteiro configurado, persistência estruturada das respostas e um painel web em Next.js para consulta, anotação e repasse interno entre o time do escritório.',
  },
  {
    question: 'Como entro em contato com a equipe?',
    answer: (
      <>
        Mande um e-mail para{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        . Respondemos em até um dia útil.
      </>
    ),
  },
];

export default function Landing() {
  return (
    <main className="text-foreground">
      {/* === HERO === Offset grid: copy on the left, WhatsApp preview on the right. */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--brand-100),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 -right-32 -z-10 size-112 rounded-full bg-brand-200/50 blur-3xl"
        />
        <div className="container-page pt-section-lg pb-section md:pt-section">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-8 lg:col-span-7">
              <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs">
                <Sparkles className="size-3.5" />
                <span>SaaS multiempresa para escritórios brasileiros</span>
              </Badge>

              <h1 className="font-display text-display text-foreground">
                Triagem jurídica por IA{' '}
                <span className="block text-brand-700 dark:text-brand-300">no WhatsApp,</span>
                <span className="block">sempre com revisão humana.</span>
              </h1>

              <p className="max-w-xl font-body text-body-lg text-muted-foreground">
                Tervox conduz a primeira conversa de cada lead no canal do escritório, faz as
                perguntas que o seu time definiu e entrega uma ficha estruturada para o advogado
                decidir os próximos passos — em conformidade com a OAB e com a LGPD.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2 px-6 font-medium shadow-brand">
                  <a href={`mailto:${CONTACT_EMAIL}`}>
                    Falar com a equipe
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="lg" className="gap-2 text-foreground">
                  <Link href="#como-funciona">Ver como funciona</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-small">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand-600 dark:text-brand-300" />
                  Em conformidade com a OAB
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand-600 dark:text-brand-300" />
                  Dados segregados por escritório
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-brand-600 dark:text-brand-300" />
                  WhatsApp Business API
                </span>
              </div>
            </div>

            {/* WhatsApp chat preview — inline SVG mock (no external assets). */}
            <div className="lg:col-span-5">
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* === MANIFESTO === Large display quote, asymmetric on purpose. */}
      <section className="border-border border-y bg-card/40">
        <div className="container-page py-section-lg">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="text-eyebrow lg:col-span-3">Motivação</p>
            <blockquote className="font-display text-foreground text-h2 leading-snug lg:col-span-9 lg:pl-8">
              Tervox não substitui o advogado — retira dele o trabalho repetitivo de coleta, para
              que ele volte a dedicar tempo ao que exige
              <span className="text-brand-700 dark:text-brand-300"> julgamento humano</span>.
            </blockquote>
          </div>
        </div>
      </section>

      {/* === COMO FUNCIONA === Vertical numbered timeline (not the standard horizontal steps). */}
      <section id="como-funciona" className="container-page py-section-lg">
        <div className="mb-12 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-eyebrow">Como funciona</p>
            <h2 className="mt-3 font-display text-foreground text-h2">
              Da primeira mensagem ao prontuário, em cinco passos.
            </h2>
          </div>
          <p className="text-body text-muted-foreground lg:col-span-6 lg:col-start-7 lg:pt-12">
            Cada etapa é desenhada para que o escritório mantenha o controle do roteiro — o que
            perguntar, em qual ordem, e o que considerar urgente cabe ao seu time jurídico, não a um
            formulário genérico.
          </p>
        </div>

        <ol className="relative space-y-6 border-border border-l pl-8 lg:pl-12">
          {flowSteps.map((step) => (
            <li key={step.n} className="relative">
              <span
                aria-hidden
                className="absolute top-1 -left-8.25 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-brand-300 bg-background font-display font-semibold text-brand-700 text-small lg:-left-12.25 dark:border-brand-700 dark:text-brand-300"
              >
                {step.n}
              </span>
              <div className="grid gap-2 lg:grid-cols-12 lg:gap-8">
                <h3 className="font-display text-foreground text-h4 lg:col-span-4">{step.title}</h3>
                <p className="text-body text-muted-foreground lg:col-span-8">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* === ENTREGAS === 3-up card grid with varied emphasis. */}
      <section id="entregas" className="bg-card/40 py-section-lg">
        <div className="container-page">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-eyebrow">O que o escritório recebe</p>
              <h2 className="mt-3 font-display text-foreground text-h2">
                O pronto atendimento. Sem a triagem manual.
              </h2>
            </div>
            <p className="text-body text-muted-foreground lg:col-span-5 lg:pt-12">
              O Tervox entrega, no MVP, a conversa estruturada e a ficha consultável. A próxima fase
              — geração assistida de minutas e peças iniciais — caminha sobre o mesmo prontuário.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <Card
                key={title}
                className="lift border-border/80 bg-card transition-colors hover:border-brand-400/70"
              >
                <CardHeader className="gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="font-display text-h4">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-body text-muted-foreground">
                    {body}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* === ÁREAS DE ATUAÇÃO === Pill grid, not the standard card grid. */}
      <section id="areas" className="container-page py-section-lg">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-eyebrow">Áreas de atuação</p>
            <h2 className="mt-3 font-display text-foreground text-h2">
              Um roteiro para cada área do direito.
            </h2>
            <p className="mt-4 text-body text-muted-foreground">
              O seu time define, por área, quais perguntas precisam de resposta e como classificar
              urgência. O Tervox segue o roteiro configurado — e nunca segue um que não foi pensado
              pelo seu escritório.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-3">
            {areas.map((area) => (
              <li key={area}>
                <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium text-foreground transition-colors hover:border-brand-400/70 hover:bg-brand-50/50 dark:hover:bg-brand-900/20">
                  <Check className="size-4 shrink-0 text-brand-600 dark:text-brand-300" />
                  {area}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* === CONFORMIDADE === Three credential rows, asymmetric layout. */}
      <section
        id="conformidade"
        className="relative overflow-hidden border-border border-y bg-card/40"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 -left-32 -z-0 size-72 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div className="container-page relative py-section-lg">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-eyebrow">Conformidade</p>
              <h2 className="mt-3 font-display text-foreground text-h2">
                Desenhado para a OAB e para a LGPD.
              </h2>
              <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground">
                A triagem conduz a coleta. O advogado conduz o caso. Cada decisão arquitetural do
                produto começa por essa regra.
              </p>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {compliancePoints.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="grid gap-6 bg-card p-6 transition-colors hover:bg-brand-50/40 md:grid-cols-12 md:p-8 dark:hover:bg-brand-900/20"
              >
                <div className="flex items-start gap-4 md:col-span-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <p className="font-mono text-caption text-muted-foreground uppercase tracking-[0.12em]">
                      {String(i + 1).padStart(2, '0')} · compromisso
                    </p>
                    <h3 className="mt-1 font-display text-foreground text-h4">{title}</h3>
                  </div>
                </div>
                <p className="text-body text-muted-foreground md:col-span-8 md:pt-3">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === Accordion. */}
      <section id="faq" className="container-page py-section-lg">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-eyebrow">Perguntas frequentes</p>
            <h2 className="mt-3 font-display text-foreground text-h2">
              Antes de falar com a gente.
            </h2>
            <p className="mt-4 text-body text-muted-foreground">
              Dúvidas comuns de escritórios avaliando o Tervox pela primeira vez. Não encontrou a
              sua? Mande um e-mail.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-6 gap-2">
              <a href={`mailto:${CONTACT_EMAIL}`}>
                <Phone className="size-4" />
                {CONTACT_EMAIL}
              </a>
            </Button>
          </div>
          <div className="lg:col-span-8">
            <Faq items={faqItems} />
          </div>
        </div>
      </section>

      <Separator />

      {/* === CTA FINAL === Full-width band, deeper background tone. */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--brand-900),var(--brand-700)_55%,var(--brand-600))]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--brand-300),transparent_60%)] opacity-30"
        />
        <div className="container-page py-section-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="font-mono text-brand-100 text-caption uppercase tracking-[0.16em]">
                Próximos passos
              </p>
              <h2 className="mt-4 font-display text-brand-50 text-h1 leading-tight">
                Pronto para começar a triagem antes que o lead&nbsp;desista?
              </h2>
              <p className="mt-4 max-w-2xl text-body-lg text-brand-100">
                Mande um e-mail para a equipe. Ajudamos seu escritório a desenhar o roteiro de
                triagem para cada área do direito e acompanhamos a implantação do primeiro tenant.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-background px-6 text-foreground shadow-lg hover:bg-card"
              >
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <ScanSearch className="size-4" />
                  Falar com a equipe
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <p className="font-mono text-brand-100 text-caption lg:text-right">
                {CONTACT_EMAIL} · resposta em até um dia útil
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Inline WhatsApp-chat-style mock — drawn entirely with utility classes (no remote img).
function ChatPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-3xl bg-brand-100/60 blur-2xl dark:bg-brand-900/40"
      />
      <Card className="overflow-hidden border-border/80 shadow-brand">
        <div className="flex items-center justify-between border-border border-b bg-brand-50 px-4 py-3 dark:bg-brand-900/40">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_var(--brand-500)]"
            />
            <p className="font-mono font-semibold text-brand-700 text-caption uppercase tracking-[0.14em] dark:text-brand-200">
              Tervox · Triagem
            </p>
          </div>
          <p className="font-mono text-caption text-muted-foreground">agora</p>
        </div>
        <CardContent className="space-y-3 bg-background p-5">
          <BotMessage>Olá, Mariana! Vamos iniciar a triagem do seu atendimento.</BotMessage>
          <BotMessage>Em qual área do direito seu caso se enquadra?</BotMessage>
          <div className="flex flex-wrap gap-2 pl-2">
            {['Trabalhista', 'Cível', 'Família'].map((opt) => (
              <span
                key={opt}
                className="rounded-full border border-brand-300 bg-brand-50 px-3 py-1 font-medium text-brand-800 transition-colors hover:border-brand-500 dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-100"
              >
                {opt}
              </span>
            ))}
          </div>
          <HumanMessage>Trabalhista</HumanMessage>
          <BotMessage>
            Certo. Pode me contar, em poucas palavras, o que está acontecendo?
          </BotMessage>
          <HumanMessage>
            Fui demitida há uma semana e não recebi as verbas rescisórias.
          </HumanMessage>
        </CardContent>
        <div className="border-border border-t bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2 rounded-full border border-input bg-background px-3 py-2">
            <span className="grow text-muted-foreground text-small">Digite sua resposta…</span>
            <span
              aria-hidden
              className="inline-flex size-6 items-center justify-center rounded-full bg-brand-500 text-brand-50"
            >
              <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
                <title>Enviar</title>
                <path d="M3 12l18-9-7 18-3-7-8-2z" />
              </svg>
            </span>
          </div>
        </div>
      </Card>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 hidden size-24 rotate-12 rounded-2xl border-2 border-brand-400/40 border-dashed lg:block"
      />
    </div>
  );
}

function BotMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <p className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2 text-foreground text-small shadow-xs">
        {children}
      </p>
    </div>
  );
}

function HumanMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2 text-primary-foreground text-small shadow-sm">
        {children}
      </p>
    </div>
  );
}
