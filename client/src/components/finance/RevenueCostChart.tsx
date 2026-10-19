import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCompactMAD, formatMAD } from '@/lib/format';
import type { FinancialComputed, FinancialInput } from '@/types';

type MonthPoint = {
  month: string;
  'Chiffre d\'affaires': number;
  'Charges totales': number;
  'Résultat mensuel': number;
};

type CumulPoint = {
  month: string;
  'Cash-flow cumulé': number;
  'Investissement initial': number;
};

function buildMonthlyData(computed: FinancialComputed): MonthPoint[] {
  return Array.from({ length: 12 }, (_, index) => ({
    month: `M${index + 1}`,
    "Chiffre d'affaires": Math.round(computed.monthlyRevenue),
    'Charges totales': Math.round(computed.monthlyTotalCosts),
    'Résultat mensuel': Math.round(computed.monthlyResult),
  }));
}

function buildCumulativeData(computed: FinancialComputed, input: FinancialInput): CumulPoint[] {
  return Array.from({ length: 13 }, (_, index) => ({
    month: index === 0 ? 'Départ' : `M${index}`,
    'Cash-flow cumulé': Math.round(computed.monthlyResult * index),
    'Investissement initial': Math.round(input.initialInvestment),
  }));
}

function tooltipFormatter(value: number | string) {
  return formatMAD(typeof value === 'number' ? value : Number(value));
}

/**
 * Graphiques financiers :
 *  1. revenus / charges / résultat, mois par mois (12 mois) ;
 *  2. cash-flow cumulé comparé à l'investissement initial (lecture du payback).
 */
export function RevenueCostChart({
  computed,
  input,
}: {
  computed: FinancialComputed;
  input: FinancialInput;
}) {
  const monthlyData = buildMonthlyData(computed);
  const cumulativeData = buildCumulativeData(computed, input);
  const cumulativeEnd = computed.monthlyResult * 12;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenus, charges et résultat (par mois)</CardTitle>
          <p className="text-xs text-slate-500">
            Projection constante sur 12 mois, à partir des hypothèses saisies.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCompactMAD(value)}
                  width={70}
                />
                <Tooltip
                  formatter={tooltipFormatter}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="Chiffre d'affaires" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Charges totales" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Résultat mensuel" radius={[3, 3, 0, 0]}>
                  {monthlyData.map((point) => (
                    <Cell
                      key={point.month}
                      fill={point['Résultat mensuel'] >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Récupération de l&apos;investissement initial</CardTitle>
          <p className="text-xs text-slate-500">
            Le point où le cash-flow cumulé rejoint la ligne horizontale correspond au payback.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumulativeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatCompactMAD(value)}
                  width={70}
                />
                <Tooltip
                  formatter={tooltipFormatter}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Line
                  type="monotone"
                  dataKey="Investissement initial"
                  stroke="#94a3b8"
                  strokeDasharray="5 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Cash-flow cumulé"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {input.initialInvestment === 0
              ? 'Aucun investissement initial saisi : cette courbe n’a pas de seuil à franchir.'
              : cumulativeEnd >= input.initialInvestment
                ? 'La droite de cash-flow cumulé franchit l’investissement initial dans l’année : l’investissement est récupéré sur la période.'
                : 'Sur 12 mois, le cash-flow cumulé reste sous l’investissement initial : l’investissement n’est pas récupéré la première année.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
