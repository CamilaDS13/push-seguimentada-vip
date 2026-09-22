const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const cssMatch = html.match(/href="(?:\.\/|\/)assets\/(index-[^"]+\.css)"/);
const jsMatch = html.match(/src="(?:\.\/|\/)assets\/(index-[^"]+\.js)"/);

if (cssMatch && jsMatch) {
  const css = fs.readFileSync(path.join(distDir, 'assets', cssMatch[1]), 'utf8');
  let js = fs.readFileSync(path.join(distDir, 'assets', jsMatch[1]), 'utf8');
  js = js.replace(/<\/script>/gi, '<\\/script>');

  let standalone = html;
  standalone = standalone.replace(/<link rel="stylesheet"[^>]*>/, `<style>\n${css}\n</style>`);
  standalone = standalone.replace(/<script type="module"[^>]*><\/script>/, `<script type="module">\n${js}\n</script>`);

  const singleFilePath = path.join(distDir, 'painel-push-completo.html');
  fs.writeFileSync(singleFilePath, standalone, 'utf8');
  console.log(`[build] Standalone single HTML created at: dist/painel-push-completo.html (${(fs.statSync(singleFilePath).size / (1024 * 1024)).toFixed(2)} MB)`);
}
