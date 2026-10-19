import 'dotenv/config';
import { createApp } from './app';
import { isLlmConfigured } from './services/llm';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('  StartUpCheck AI - serveur API');
    console.log(`  ➜  http://localhost:${PORT}`);
    console.log(`  ➜  http://localhost:${PORT}/api/health`);
    console.log('');
    console.log(
      isLlmConfigured()
        ? "  Enrichissement IA générative : ACTIVÉ (le moteur local reste utilisé pour les scores)"
        : "  Enrichissement IA générative : DÉSACTIVÉ (moteur d'analyse local uniquement)",
    );
    console.log('');
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[api] Arrêt demandé (${signal})...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(async (error) => {
  console.error('[api] Impossible de démarrer le serveur :', error);
  await prisma.$disconnect();
  process.exit(1);
});
