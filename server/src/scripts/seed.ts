/**
 * Pré-remplit la base avec des analyses d'exemple.
 * Usage : npm run seed
 */

import 'dotenv/config';
import { SAMPLE_IDEAS } from '../data/sampleIdeas';
import { createAnalysis } from '../services/analysisService';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n[seed] Pré-remplissage de la base...\n');

  for (const sample of SAMPLE_IDEAS) {
    const existing = await prisma.analysis.findFirst({
      where: { projectName: sample.projectName },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ~ "${sample.projectName}" déjà présent (ignoré)`);
      continue;
    }

    const record = await createAnalysis(
      {
        projectName: sample.projectName,
        description: sample.description,
        sector: sample.sector,
        market: sample.market,
        targetClients: sample.targetClients,
        budget: sample.budget,
      },
      sample.financial,
    );

    console.log(
      `  + "${record.projectName}" → ${record.globalScore}/100 (${record.verdictLabel}, risque ${record.riskLabel}) [${record.meta.engine}]${
        record.financial ? ' + Financial Check' : ''
      }`,
    );
  }

  const total = await prisma.analysis.count();
  console.log(`\n[seed] Terminé. ${total} analyse(s) en base.\n`);
}

main()
  .catch((error) => {
    console.error('[seed] Échec :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
