import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Compass,
  Gauge,
  Layers,
  LineChart,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const FEATURES = [
  {
    icon: Gauge,
    title: 'Score global sur 100',
    text: "Un indicateur unique de viabilité, calculé à partir de cinq dimensions pondérées.",
    tone: 'from-brand-500 to-violet-500',
  },
  {
    icon: Target,
    title: '5 scores détaillés',
    text: 'Marché, faisabilité, innovation, croissance et niveau de risque, chacun expliqué.',
    tone: 'from-sky-500 to-cyan-500',
  },
  {
    icon: Layers,
    title: 'Analyse SWOT',
    text: 'Forces, faiblesses, opportunités et menaces construites à partir de vos données.',
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    icon: ListChecks,
    title: 'Recommandations',
    text: 'Des conseils priorisés et actionnables pour améliorer concrètement le projet.',
    tone: 'from-amber-500 to-orange-500',
  },
  {
    icon: ShieldCheck,
    title: 'Niveau de risque',
    text: 'Identification des principaux facteurs de risque et de leur poids réel.',
    tone: 'from-rose-500 to-red-500',
  },
  {
    icon: BrainCircuit,
    title: 'Verdict final',
    text: 'À développer, à améliorer ou risqué : une décision claire et argumentée.',
    tone: 'from-violet-500 to-fuchsia-500',
  },
];

const STEPS = [
  {
    icon: Compass,
    title: 'Décrivez votre idée',
    text: 'Nom, description, secteur, marché, clientèle cible et budget disponible.',
  },
  {
    icon: BarChart3,
    title: 'Le moteur analyse',
    text: 'Un moteur de scoring déterministe applique des barèmes sectoriels, puis un générateur rédige le rapport.',
  },
  {
    icon: LineChart,
    title: 'Recevez votre rapport',
    text: 'Dashboard complet : score, radar, SWOT, recommandations et verdict.',
  },
];

export function HomePage() {
  return (
    <div className="pb-4">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-float rounded-full bg-brand-300/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-32 h-80 w-80 animate-float rounded-full bg-violet-300/30 blur-3xl"
          style={{ animationDelay: '1.5s' }}
          aria-hidden
        />

        <PageContainer size="wide" className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge tone="brand" size="md" className="mx-auto mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Projet universitaire · moteur d'analyse déterministe
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Votre idée de business, <span className="gradient-text">analysée en quelques secondes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
            >
              StartUpCheck AI évalue la viabilité de votre projet : score global sur 100, analyse SWOT,
              recommandations priorisées et verdict final. Aucune inscription, tout fonctionne en local.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link to="/analyser" className="btn-primary w-full !px-7 !py-3.5 text-base sm:w-auto">
                Analyser mon idée
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/a-propos" className="btn-ghost w-full !px-7 !py-3.5 text-base sm:w-auto">
                Comprendre la méthode
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Fonctionne sans API externe
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-brand-500" />
                Scores reproductibles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-violet-500" />
                Budget en dirhams (DH)
              </span>
            </motion.div>
          </div>
        </PageContainer>
      </section>

      {/* ---------------------------- FONCTIONNALITÉS ---------------------------- */}
      <PageContainer size="wide" className="pb-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Ce que vous obtenez</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Un rapport d'analyse complet
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Chaque section du dashboard répond à une question concrète : est-ce que ce projet peut
            fonctionner, où sont les risques, et que faut-il faire ensuite.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <Card hover className="h-full p-5 sm:p-6">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.tone} text-white shadow-glow`}
                >
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{feature.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageContainer>

      {/* ------------------------------ ÉTAPES ------------------------------ */}
      <PageContainer size="wide" className="pb-16">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-violet-50/60 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Comment ça marche</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Trois étapes, un rapport complet
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/[0.04] text-brand-600 ring-1 ring-slate-200">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    Étape {index + 1}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>

      {/* -------------------------------- CTA -------------------------------- */}
      <PageContainer size="default" className="pb-8">
        <Card className="overflow-hidden border-transparent bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500">
          <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Prêt à tester votre idée ?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-white/90">
              Utilisez l'exemple <span className="font-bold">StageConnect</span> pour voir le dashboard
              complet immédiatement, puis remplacez-le par votre propre projet.
            </p>
            <Link
              to="/analyser"
              className="btn bg-white !px-7 !py-3.5 text-base text-brand-700 shadow-lg hover:bg-white/90"
            >
              Lancer une analyse
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </PageContainer>
    </div>
  );
}
