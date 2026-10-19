import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Calculator,
  Database,
  Gauge,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, SectionHeading } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/analysisStore';

const WEIGHTS = [
  { label: 'Potentiel du marché', value: 25, color: 'from-indigo-500 to-indigo-400' },
  { label: 'Faisabilité', value: 20, color: 'from-sky-500 to-sky-400' },
  { label: 'Innovation', value: 20, color: 'from-purple-500 to-purple-400' },
  { label: 'Potentiel de croissance', value: 20, color: 'from-emerald-500 to-emerald-400' },
  { label: 'Niveau de risque (inversé)', value: 15, color: 'from-rose-500 to-rose-400' },
];

const STEPS = [
  {
    icon: Database,
    title: '1. Barèmes sectoriels',
    text: "Chaque secteur possède des indices internes : attractivité du marché, dynamique de croissance, ticket d'entrée, lourdeur réglementaire, complexité technique, scalabilité et intensité concurrentielle. Un marché cible ajoute sa maturité, son pouvoir d'achat et son adoption numérique.",
  },
  {
    icon: Calculator,
    title: '2. Analyse de votre saisie',
    text: "La description est analysée localement : volume d'information, présence du problème, de la solution et du modèle économique, détection de signaux d'innovation (IA, marketplace, abonnement, données…). Le ciblage client est évalué de la même manière.",
  },
  {
    icon: Wallet,
    title: '3. Adequation du budget',
    text: "Votre budget est comparé au ticket d'entrée estimé du secteur via une courbe décroissante. Plus le ratio est faible, plus la faisabilité baisse et plus le niveau de risque augmente.",
  },
  {
    icon: Scale,
    title: '4. Pondération et verdict',
    text: 'Les cinq dimensions sont combinées selon leurs poids. Le risque est inversé : un risque élevé réduit le score global. Le verdict découle de seuils fixes.',
  },
];

export function AboutPage() {
  const meta = useAppStore((s) => s.meta);

  return (
    <PageContainer className="py-8 sm:py-10">
      <div className="mb-8 max-w-3xl">
        <Badge tone="brand" className="mb-3">
          <Info className="h-3.5 w-3.5" />
          Méthodologie
        </Badge>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Comment StartUpCheck AI analyse une idée
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Cette page décrit précisément la méthode utilisée, afin que chaque score affiché puisse être
          expliqué et reproduit. L'objectif n'est pas de prédire l'avenir, mais de fournir une grille de
          lecture structurée et cohérente d'un projet.
        </p>
      </div>

      {/* Transparence */}
      <Card className="mb-8 border-emerald-200/70 bg-emerald-50/50">
        <CardContent className="flex flex-col gap-3 p-5 pt-5 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-emerald-900">
              Le calcul fonctionne entièrement en local
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Aucune clé API n'est nécessaire. Le moteur d'analyse déterministe calcule les scores à
              partir de règles de calcul et de barèmes internes : deux analyses des mêmes informations
              donnent exactement le même résultat. Un enrichissement par IA générative peut être activé
              pour la rédaction du SWOT et des recommandations, mais il reste strictement optionnel et
              n'intervient jamais dans le calcul des scores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Étapes */}
      <SectionHeading
        eyebrow="Déroulé du calcul"
        title="Quatre étapes successives"
        icon={<Calculator className="h-5 w-5 text-brand-600" />}
      />
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <Card className="h-full p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-extrabold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{step.text}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-brand-600" />
              Formule du score global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-xs">
              <span className="text-brand-300">score</span> ={' '}
              <span className="text-amber-300">0.25</span> × marché
              <br />
              &nbsp;&nbsp;&nbsp;+ <span className="text-amber-300">0.20</span> × faisabilité
              <br />
              &nbsp;&nbsp;&nbsp;+ <span className="text-amber-300">0.20</span> × innovation
              <br />
              &nbsp;&nbsp;&nbsp;+ <span className="text-amber-300">0.20</span> × croissance
              <br />
              &nbsp;&nbsp;&nbsp;+ <span className="text-amber-300">0.15</span> × (
              <span className="text-rose-300">100 − risque</span>)
            </div>

            <ul className="space-y-3">
              {WEIGHTS.map((weight) => (
                <li key={weight.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{weight.label}</span>
                    <span className="font-extrabold tabular-nums text-slate-800">{weight.value} %</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${weight.color}`}
                      style={{ width: `${weight.value * 4}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Seuils + moteur */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seuils du verdict</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'À développer', range: '70 – 100', tone: 'bg-emerald-500' },
                { label: 'À améliorer', range: '50 – 69', tone: 'bg-amber-500' },
                { label: 'Risqué', range: '0 – 49', tone: 'bg-rose-500' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                  <span className="text-sm font-bold text-slate-800">{row.label}</span>
                  <span className="ml-auto text-xs font-bold tabular-nums text-slate-400">
                    score {row.range}
                  </span>
                </div>
              ))}

              <div className="mt-2 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Niveau de risque
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    ['Faible', '0 – 29'],
                    ['Modéré', '30 – 49'],
                    ['Élevé', '50 – 69'],
                    ['Très élevé', '70 – 100'],
                  ].map(([label, range]) => (
                    <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="font-bold text-slate-700">{label}</p>
                      <p className="text-slate-400">{range}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200/70 bg-violet-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-900">
                <BrainCircuit className="h-4 w-4" />
                Enrichissement par IA générative (optionnel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs leading-relaxed text-violet-800">
                L'application peut être reliée à une API compatible OpenAI pour rédiger le SWOT, les
                recommandations et la justification du verdict. Les scores, eux, restent calculés
                localement.
              </p>
              <div className="rounded-xl border border-violet-200 bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  État actuel
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  {meta?.engine.llmConfigured
                    ? `Activé (${meta.engine.llmProvider ?? 'fournisseur'}${meta.engine.llmModel ? ` · ${meta.engine.llmModel}` : ''})`
                    : 'Désactivé — le moteur local est utilisé'}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-violet-700">
                Lorsqu'il est désactivé, l'application l'indique explicitement sur chaque rapport :
                aucune mention d'IA générative n'est affichée à tort.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Module financier */}
      <div className="mt-8">
        <SectionHeading
          eyebrow="Module complémentaire"
          title="Financial Check — analyse financière prévisionnelle"
          description="L'onglet Finance du dashboard applique exactement les mêmes règles de calcul à cinq chiffres clés que vous saisissez. Aucune IA générative n'intervient dans les montants."
          icon={<Wallet className="h-5 w-5 text-brand-600" />}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-600" />
                Indicateurs calculés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-xs">
                marge = prix − coût variable
                <br />
                résultat mensuel = prix×ventes − coûts − charges fixes
                <br />
                seuil (CA) = charges fixes ÷ taux de marge
                <br />
                ROI annuel = résultat annuel ÷ investissement
                <br />
                payback = investissement ÷ résultat mensuel
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                Les divisions par zéro sont explicitement gérées : l&apos;interface affiche
                «&nbsp;Non atteignable&nbsp;» ou «&nbsp;Non applicable&nbsp;» plutôt qu&apos;un
                montant inventé. Les pertes sont conservées et affichées.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-brand-600" />
                Les trois scénarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-[11px]">
                {[
                  ['Pessimiste', 'ventes −30 %, prix −10 %, coûts +', 'bg-rose-50 text-rose-700'],
                  ['Réaliste', 'correspond strictement à vos saisies', 'bg-brand-50 text-brand-700'],
                  ['Optimiste', 'ventes +25 %, prix +5 %, coûts −', 'bg-emerald-50 text-emerald-700'],
                ].map(([label, detail, tone]) => (
                  <div key={label} className={`rounded-lg px-3 py-2 ${tone}`}>
                    <p className="font-bold">{label}</p>
                    <p className="opacity-80">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Les scénarios pessimiste et optimiste sont des <strong>hypothèses de simulation
                pédagogiques</strong> et non des prévisions. L&apos;investissement initial n&apos;est
                jamais modulé. Ces montants restent des projections et non un conseil financier.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Limites */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            Limites assumées de l'outil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 text-[13px] leading-relaxed text-slate-600 sm:grid-cols-2">
            <li className="rounded-xl bg-slate-50 p-4">
              Les barèmes sectoriels sont des <strong>indices heuristiques</strong> construits à partir
              d'ordres de grandeur publics. Ils ne remplacent pas une étude de marché réelle.
            </li>
            <li className="rounded-xl bg-slate-50 p-4">
              L'analyse de la description repose sur des <strong>règles de correspondance lexicale</strong> :
              une idée mal décrite est pénalisée, même si le concept est solide.
            </li>
            <li className="rounded-xl bg-slate-50 p-4">
              Le budget est comparé à un <strong>ticket d'entrée indicatif</strong> par secteur, et non à
              votre plan de trésorerie détaillé.
            </li>
            <li className="rounded-xl bg-slate-50 p-4">
              Aucune donnée personnelle n'est envoyée à l'extérieur : tout est stocké dans une base
              SQLite locale sur votre machine.
            </li>
            <li className="rounded-xl bg-slate-50 p-4">
              Le module financier raisonne en <strong>régime mensuel constant</strong> (pas de
              saisonnalité, ni TVA, ni impôts) : il fournit des ordres de grandeur, pas une trésorerie
              comptable.
            </li>
            <li className="rounded-xl bg-slate-50 p-4">
              Les montants financiers sont des <strong>projections</strong> issues de vos hypothèses et
              ne constituent pas un conseil financier.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center">
        <Link to="/analyser" className="btn-primary">
          Tester la méthode sur mon idée
        </Link>
      </div>
    </PageContainer>
  );
}
