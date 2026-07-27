import { access, mkdir, open, readFile, rename, rm, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_OUTPUT_DIR = path.join(SITE_ROOT, 'images', 'news');
const MASTER_WIDTH = 1600;
const MASTER_HEIGHT = 900;
const VARIANT_WIDTHS = [768, 1200, 1600];

function usage() {
  return [
    'Использование:',
    '  node scripts/news-image.mjs <исходник> <slug> [--output-dir <папка>] [--force]',
    '',
    'Пример:',
    '  npm run news:image -- C:\\Temp\\cover.png msc-2026-playoff-schedule'
  ].join('\n');
}

function parseArguments(argv) {
  const positional = [];
  let outputDir = DEFAULT_OUTPUT_DIR;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--force') {
      force = true;
      continue;
    }
    if (value === '--output-dir') {
      const next = argv[index + 1];
      if (!next) throw new Error('После --output-dir нужна папка.');
      outputDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (value.startsWith('--')) throw new Error(`Неизвестный параметр: ${value}`);
    positional.push(value);
  }

  if (positional.length !== 2) throw new Error(usage());
  const [inputValue, slug] = positional;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('slug должен состоять из строчных латинских букв, цифр и дефисов.');
  }

  return {
    inputPath: path.resolve(inputValue),
    outputDir,
    slug,
    force
  };
}

async function assertWritableTargets(targets, force) {
  if (force) return;
  for (const target of targets) {
    try {
      await access(target);
      throw new Error(`Файл уже существует: ${target}. Используйте --force только для осознанной замены.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function clearStaleSlugLock(lockPath) {
  let observed;
  let lockStat;
  try {
    [observed, lockStat] = await Promise.all([readFile(lockPath, 'utf8'), stat(lockPath)]);
  } catch {
    return false;
  }
  if (Date.now() - lockStat.mtimeMs < 60_000) return false;

  const pid = Number(observed.trim().split(/\s+/)[0]);
  let processIsAlive = Number.isInteger(pid) && pid > 0;
  if (processIsAlive) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      processIsAlive = error.code === 'EPERM';
    }
  }
  if (processIsAlive) return false;

  const confirmed = await readFile(lockPath, 'utf8').catch(() => '');
  if (confirmed !== observed) return false;
  await unlink(lockPath);
  return true;
}

async function acquireSlugLock(outputDir, slug, allowRecovery = true) {
  const lockPath = path.join(outputDir, `.${slug}.news-image.lock`);
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      if (allowRecovery && await clearStaleSlugLock(lockPath)) {
        return acquireSlugLock(outputDir, slug, false);
      }
      throw new Error(`Обложка для slug="${slug}" уже обрабатывается другим процессом.`);
    }
    throw error;
  }
  try {
    await lockHandle.writeFile(`${process.pid} ${new Date().toISOString()}\n`, 'utf8');
  } catch (error) {
    await lockHandle.close().catch(() => {});
    await unlink(lockPath).catch(() => {});
    throw error;
  }

  return async () => {
    await lockHandle.close();
    await unlink(lockPath).catch(() => {});
  };
}

async function commitTempFiles(staged, force) {
  const committed = [];
  const backups = [];
  try {
    for (const item of staged) {
      if (force) {
        const backup = `${item.target}.${process.pid}.${Date.now()}.bak`;
        try {
          await rename(item.target, backup);
          backups.push({ backup, target: item.target });
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      }
      await rename(item.temp, item.target);
      committed.push(item.target);
    }
  } catch (error) {
    await Promise.all(staged.map((item) => rm(item.temp, { force: true })));
    await Promise.all(committed.map((target) => rm(target, { force: true })));
    for (const { backup, target } of backups.reverse()) {
      await rename(backup, target).catch(() => {});
    }
    throw error;
  }

  const cleanupFailures = [];
  for (const { backup } of backups) {
    try {
      await rm(backup, { force: true });
    } catch (error) {
      cleanupFailures.push(`${backup}: ${error.message}`);
    }
  }
  if (cleanupFailures.length) {
    process.stderr.write(
      `Обложка сохранена, но не удалось удалить резервные копии:\n- ${cleanupFailures.join('\n- ')}\n`
    );
  }
}

async function main() {
  const { inputPath, outputDir, slug, force } = parseArguments(process.argv.slice(2));
  const input = await readFile(inputPath);
  const metadata = await sharp(input, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Не удалось определить размер исходника.');
  if (metadata.width < 1200 || metadata.height < 630) {
    throw new Error(
      `Исходник ${metadata.width}×${metadata.height} слишком мал. Нужен минимум 1200×630.`
    );
  }

  await mkdir(outputDir, { recursive: true });
  const releaseLock = await acquireSlugLock(outputDir, slug);
  try {
    const masterTarget = path.join(outputDir, `${slug}.jpg`);
    const webpTargets = VARIANT_WIDTHS.map((width) => (
      path.join(outputDir, `${slug}-${width}.webp`)
    ));
    const targets = [masterTarget, ...webpTargets];
    await assertWritableTargets(targets, force);

    const normalized = await sharp(input, { failOn: 'error' })
      .autoOrient()
      .resize(MASTER_WIDTH, MASTER_HEIGHT, {
        fit: 'contain',
        background: '#071522',
        withoutEnlargement: false
      })
      .removeAlpha()
      .toBuffer();

    const nonce = `${process.pid}-${Date.now()}`;
    const staged = [
      { temp: `${masterTarget}.${nonce}.tmp`, target: masterTarget },
      ...webpTargets.map((target) => ({ temp: `${target}.${nonce}.tmp`, target }))
    ];
    try {
      await sharp(normalized)
        .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toFile(staged[0].temp);

      for (let index = 0; index < VARIANT_WIDTHS.length; index += 1) {
        await sharp(normalized)
          .resize({ width: VARIANT_WIDTHS[index], withoutEnlargement: false })
          .webp({ quality: 84, effort: 5 })
          .toFile(staged[index + 1].temp);
      }
    } catch (error) {
      await Promise.all(staged.map(({ temp }) => rm(temp, { force: true }).catch(() => {})));
      throw error;
    }

    await commitTempFiles(staged, force);

    const publicPrefix = path.resolve(outputDir) === path.resolve(DEFAULT_OUTPUT_DIR)
      ? '/images/news/'
      : `${path.resolve(outputDir)}${path.sep}`;
    const publicPath = (filename) => `${publicPrefix}${filename}`;
    const result = {
      source: {
        path: inputPath,
        width: metadata.width,
        height: metadata.height
      },
      heroAssets: {
        src: publicPath(`${slug}.jpg`),
        width: MASTER_WIDTH,
        height: MASTER_HEIGHT,
        webpSrcset: VARIANT_WIDTHS
          .map((width) => `${publicPath(`${slug}-${width}.webp`)} ${width}w`)
          .join(', '),
        focalPoint: '50% 50%',
        cardFit: 'contain'
      }
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await releaseLock();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
