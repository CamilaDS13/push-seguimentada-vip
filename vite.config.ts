import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function getCandidateUrls(inputUrl: string): string[] {
  const urls: string[] = [];
  const match = inputUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{20,})/);
  if (match && match[1] && match[1] !== 'e') {
    const id = match[1];
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=P%C3%A1gina1`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`);
    urls.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`);
  }
  if (inputUrl.includes('/pubhtml')) {
    urls.push(inputUrl.replace('/pubhtml', '/pub?output=csv'));
  }
  urls.push(inputUrl);
  return Array.from(new Set(urls));
}

function googleSheetProxyPlugin(): Plugin {
  return {
    name: 'google-sheet-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/sync-sheet')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'URL da planilha não informada' }));
              return;
            }

            const candidateUrls = getCandidateUrls(targetUrl);
            let fetchedCsv = '';
            let lastStatus = 404;

            for (const candUrl of candidateUrls) {
              try {
                const response = await fetch(candUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }
                });

                if (response.ok) {
                  const text = await response.text();
                  if (text && !text.includes('<!DOCTYPE html>') && !text.includes('Page Not Found')) {
                    fetchedCsv = text;
                    lastStatus = 200;
                    break;
                  }
                } else {
                  lastStatus = response.status;
                }
              } catch (e) {
                // try next
              }
            }

            if (lastStatus === 200 && fetchedCsv) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/csv; charset=utf-8');
              res.end(fetchedCsv);
              return;
            }

            res.statusCode = lastStatus || 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: lastStatus,
              error: `A planilha retornou erro HTTP ${lastStatus}`
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Erro ao sincronizar' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), googleSheetProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
