import { CATEGORIES, Category, RepoAnalysis } from '@/types';

/**
 * Parses a GitHub repository URL into owner and repo.
 * Accepts:
 *  - https://github.com/owner/repo
 *  - http://github.com/owner/repo
 *  - With or without www.
 *  - With or without .git suffix
 *  - With or without trailing slash
 *  - With /tree/... suffix or other path suffixes
 *  - Bare github.com/owner/repo
 *
 * Rejects any other host.
 * Owner and repo must match ^[A-Za-z0-9._-]+$ and be <= 100 characters.
 */
export function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Add protocol if bare URL
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  // Enforce protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Reject any host other than github.com or www.github.com
  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return null;
  }

  // Extract path segments
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const owner = segments[0];
  let repo = segments[1];

  // Strip .git suffix if present
  if (repo.toLowerCase().endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  // Validate owner and repo identifiers:
  // Must match ^[A-Za-z0-9._-]+$, not be '.' or '..', and length <= 100
  const validPattern = /^[A-Za-z0-9._-]+$/;
  if (
    !owner ||
    !repo ||
    owner === '.' ||
    owner === '..' ||
    repo === '.' ||
    repo === '..' ||
    owner.length > 100 ||
    repo.length > 100 ||
    !validPattern.test(owner) ||
    !validPattern.test(repo)
  ) {
    return null;
  }

  return { owner, repo };
}

/**
 * Normalizes an array of tags to follow project validation rules:
 * - 1 to 8 tags
 * - 1 to 24 chars each
 * - No duplicates (case-insensitive)
 * - Trimmed strings
 * Anything not a string or empty is dropped.
 */
export function normalizeStackTags(tags: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(tags)) {
    list = tags;
  } else if (typeof tags === 'string') {
    list = tags.split(',').map((t) => t.trim());
  } else {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (trimmed.length < 1 || trimmed.length > 24) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(trimmed);
    if (result.length >= 8) break;
  }

  return result;
}

/**
 * Deterministically detects tech stack tags from repository manifest contents.
 */
export function detectStackFromManifests(files: Record<string, string>): string[] {
  const detected = new Set<string>();

  // 1. package.json
  const pkgContent = files['package.json'];
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
      };

      const depNames = Object.keys(allDeps).map((d) => d.toLowerCase());

      const depMap: Record<string, string> = {
        react: 'React',
        next: 'Next.js',
        vue: 'Vue',
        svelte: 'Svelte',
        express: 'Express',
        tailwindcss: 'Tailwind CSS',
        typescript: 'TypeScript',
        vite: 'Vite',
        prisma: 'Prisma',
        '@prisma/client': 'Prisma',
        nestjs: 'NestJS',
        '@nestjs/core': 'NestJS',
        angular: 'Angular',
        '@angular/core': 'Angular',
        fastify: 'Fastify',
        hono: 'Hono',
        zustand: 'Zustand',
        redux: 'Redux',
        '@reduxjs/toolkit': 'Redux',
        graphql: 'GraphQL',
        trpc: 'tRPC',
        '@trpc/server': 'tRPC',
        astro: 'Astro',
        remix: 'Remix',
        electron: 'Electron',
        'react-native': 'React Native',
        expo: 'Expo',
      };

      for (const [depKey, label] of Object.entries(depMap)) {
        if (depNames.includes(depKey)) {
          detected.add(label);
        }
      }
    } catch {
      // Ignore JSON parse errors in malformed package.json
    }
  }

  // 2. requirements.txt or pyproject.toml
  const pyReqs = files['requirements.txt'] || '';
  const pyProject = files['pyproject.toml'] || '';
  const pyContent = `${pyReqs}\n${pyProject}`.toLowerCase();

  if (pyReqs || pyProject) {
    detected.add('Python');
    const pyMap: Record<string, string> = {
      flask: 'Flask',
      django: 'Django',
      fastapi: 'FastAPI',
      pandas: 'Pandas',
      torch: 'PyTorch',
      pytorch: 'PyTorch',
      tensorflow: 'TensorFlow',
      numpy: 'NumPy',
      scipy: 'SciPy',
      'scikit-learn': 'scikit-learn',
      sklearn: 'scikit-learn',
      celery: 'Celery',
    };

    for (const [key, label] of Object.entries(pyMap)) {
      const regex = new RegExp(`(^|[^a-z0-9_-])${key}([^a-z0-9_-]|$)`, 'i');
      if (regex.test(pyContent)) {
        detected.add(label);
      }
    }
  }

  // 3. pubspec.yaml (Flutter / Dart)
  const pubspec = files['pubspec.yaml'];
  if (pubspec) {
    detected.add('Flutter');
    detected.add('Dart');
  }

  // 4. build.gradle or build.gradle.kts
  const gradle = files['build.gradle'] || files['build.gradle.kts'];
  if (gradle) {
    detected.add('Java');
    if (gradle.toLowerCase().includes('kotlin')) {
      detected.add('Kotlin');
    }
    if (gradle.toLowerCase().includes('android')) {
      detected.add('Android');
    }
    if (gradle.toLowerCase().includes('spring-boot') || gradle.toLowerCase().includes('springframework')) {
      detected.add('Spring Boot');
    }
  }

  // 5. pom.xml
  const pom = files['pom.xml'];
  if (pom) {
    detected.add('Java');
    if (pom.toLowerCase().includes('spring-boot') || pom.toLowerCase().includes('springframework')) {
      detected.add('Spring Boot');
    }
  }

  // 6. Cargo.toml (Rust)
  const cargo = files['Cargo.toml'];
  if (cargo) {
    detected.add('Rust');
    const lowerCargo = cargo.toLowerCase();
    if (lowerCargo.includes('actix')) detected.add('Actix');
    if (lowerCargo.includes('axum')) detected.add('Axum');
    if (lowerCargo.includes('tokio')) detected.add('Tokio');
  }

  // 7. go.mod (Go)
  const goMod = files['go.mod'];
  if (goMod) {
    detected.add('Go');
    const lowerGo = goMod.toLowerCase();
    if (lowerGo.includes('gin-gonic/gin')) detected.add('Gin');
    if (lowerGo.includes('labstack/echo')) detected.add('Echo');
    if (lowerGo.includes('gofiber/fiber')) detected.add('Fiber');
  }

  return normalizeStackTags(Array.from(detected));
}

/**
 * Suggests a Category based on detected stack and GitHub languages.
 */
export function suggestCategory(stack: string[], languages: string[]): Category {
  const allTerms = [...stack, ...languages].map((s) => s.toLowerCase());
  const tokenSet = new Set(allTerms);

  const has = (...terms: string[]) => terms.some((t) => tokenSet.has(t.toLowerCase()));

  // Mobile App
  if (has('flutter', 'dart', 'react native', 'react-native', 'swift', 'android', 'ios', 'expo')) {
    return 'Mobile App';
  }

  // Data / ML
  if (has('pandas', 'pytorch', 'torch', 'tensorflow', 'numpy', 'scipy', 'scikit-learn', 'jupyter', 'jupyter notebook', 'keras')) {
    return 'Data / ML';
  }

  // Game
  if (has('unity', 'unreal', 'godot', 'phaser', 'pygame', 'game', 'opengl', 'webgl')) {
    return 'Game';
  }

  // CLI Tool
  if (has('cli', 'commander', 'yargs', 'cobra', 'clap', 'typer', 'click')) {
    return 'CLI Tool';
  }

  // Library
  if (has('library', 'sdk', 'package', 'plugin', 'middleware')) {
    return 'Library';
  }

  // API / Backend
  if (
    has(
      'express',
      'fastapi',
      'flask',
      'django',
      'nestjs',
      'nest',
      'fastify',
      'spring boot',
      'spring',
      'gin',
      'echo',
      'fiber',
      'axum',
      'actix',
      'celery',
      'redis',
      'postgresql',
      'mysql',
      'prisma',
      'graphql'
    )
  ) {
    return 'API / Backend';
  }

  // Web App
  if (
    has(
      'react',
      'next.js',
      'vue',
      'svelte',
      'angular',
      'tailwind css',
      'tailwindcss',
      'vite',
      'html',
      'css',
      'astro',
      'remix'
    )
  ) {
    return 'Web App';
  }

  // Fallbacks by language
  if (languages.some((l) => ['Python', 'Go', 'Rust', 'Java'].includes(l))) {
    return 'API / Backend';
  }
  if (languages.some((l) => ['TypeScript', 'JavaScript', 'HTML'].includes(l))) {
    return 'Web App';
  }

  return 'Web App';
}

/**
 * Strictly validates the analysis result returned by xAI Grok or fallback.
 * Never trusts model output. Returns null if invalid.
 */
export function validateAnalysisResult(raw: unknown): RepoAnalysis | null {
  if (!raw) return null;

  let candidate: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      candidate = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (typeof raw === 'object') {
    candidate = raw as Record<string, unknown>;
  } else {
    return null;
  }

  // 1. name: string 2-60 chars
  if (typeof candidate.name !== 'string') return null;
  const name = candidate.name.trim();
  if (name.length < 2 || name.length > 60) return null;

  // 2. description: string 1-500 chars
  if (typeof candidate.description !== 'string') return null;
  const description = candidate.description.trim();
  if (description.length < 1 || description.length > 500) return null;

  // 3. stack: 1 to 8 tags
  const stack = normalizeStackTags(candidate.stack);
  if (stack.length < 1 || stack.length > 8) return null;

  // 4. category: must be in CATEGORIES (allow case-insensitive match to canonical category)
  if (typeof candidate.category !== 'string') return null;
  const matchedCategory = CATEGORIES.find(
    (c) => c.toLowerCase() === (candidate.category as string).trim().toLowerCase()
  );
  if (!matchedCategory) return null;

  // 5. repoUrl: must be a valid GitHub URL
  if (typeof candidate.repoUrl !== 'string') return null;
  const repoUrl = candidate.repoUrl.trim();
  if (!parseGithubUrl(repoUrl)) return null;

  // 6. source: must be 'github+ai' or 'github-only'
  const source = candidate.source;
  if (source !== 'github+ai' && source !== 'github-only') return null;

  // 7. lastPushedAt: optional ISO date string
  let lastPushedAt: string | undefined = undefined;
  if (candidate.lastPushedAt !== undefined && candidate.lastPushedAt !== null) {
    if (typeof candidate.lastPushedAt === 'string' && candidate.lastPushedAt.trim()) {
      const parsedTime = Date.parse(candidate.lastPushedAt);
      if (!isNaN(parsedTime)) {
        lastPushedAt = new Date(parsedTime).toISOString();
      }
    }
  }

  return {
    name,
    description,
    stack,
    category: matchedCategory,
    lastPushedAt,
    source,
    repoUrl,
  };
}
