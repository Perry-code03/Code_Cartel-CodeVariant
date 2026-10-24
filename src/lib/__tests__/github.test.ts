import { describe, it, expect } from 'vitest';
import {
  parseGithubUrl,
  normalizeStackTags,
  detectStackFromManifests,
  suggestCategory,
  validateAnalysisResult,
  generateLocalRepoFallback,
} from '../github';

describe('github.ts - parseGithubUrl', () => {
  it('parses standard https GitHub URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('parses http and www GitHub URLs', () => {
    expect(parseGithubUrl('http://github.com/vuejs/core')).toEqual({
      owner: 'vuejs',
      repo: 'core',
    });
    expect(parseGithubUrl('https://www.github.com/angular/angular')).toEqual({
      owner: 'angular',
      repo: 'angular',
    });
  });

  it('parses URLs with .git suffix', () => {
    expect(parseGithubUrl('https://github.com/sveltejs/svelte.git')).toEqual({
      owner: 'sveltejs',
      repo: 'svelte',
    });
  });

  it('parses URLs with trailing slash and sub-paths', () => {
    expect(parseGithubUrl('https://github.com/tailwindlabs/tailwindcss/')).toEqual({
      owner: 'tailwindlabs',
      repo: 'tailwindcss',
    });
    expect(parseGithubUrl('https://github.com/vercel/next.js/tree/canary/packages')).toEqual({
      owner: 'vercel',
      repo: 'next.js',
    });
  });

  it('parses bare github.com URLs', () => {
    expect(parseGithubUrl('github.com/expressjs/express')).toEqual({
      owner: 'expressjs',
      repo: 'express',
    });
    expect(parseGithubUrl('github.com/torvalds/linux/')).toEqual({
      owner: 'torvalds',
      repo: 'linux',
    });
  });

  it('supports allowed characters in owner and repo names', () => {
    expect(parseGithubUrl('https://github.com/my-org_99.test/repo-name_1.0')).toEqual({
      owner: 'my-org_99.test',
      repo: 'repo-name_1.0',
    });
  });

  it('rejects non-github hosts', () => {
    expect(parseGithubUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseGithubUrl('https://bitbucket.org/owner/repo')).toBeNull();
    expect(parseGithubUrl('https://github.attacker.com/owner/repo')).toBeNull();
    expect(parseGithubUrl('https://not-github.com/owner/repo')).toBeNull();
  });

  it('rejects SSRF / path traversal attempts and invalid characters', () => {
    expect(parseGithubUrl('https://github.com/..')).toBeNull();
    expect(parseGithubUrl('https://github.com/../..')).toBeNull();
    expect(parseGithubUrl('https://github.com/.')).toBeNull();
    expect(parseGithubUrl('https://github.com/owner')).toBeNull();
    expect(parseGithubUrl('https://github.com/owner/repo with spaces')).toBeNull();
    expect(parseGithubUrl('https://github.com/owner/repo$bad')).toBeNull();
    expect(parseGithubUrl('https://github.com/owner/repo@bad')).toBeNull();
    expect(parseGithubUrl('')).toBeNull();
    expect(parseGithubUrl('   ')).toBeNull();
    expect(parseGithubUrl(null as unknown as string)).toBeNull();
    expect(parseGithubUrl(123 as unknown as string)).toBeNull();
  });

  it('rejects names exceeding 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(parseGithubUrl(`https://github.com/${longName}/repo`)).toBeNull();
    expect(parseGithubUrl(`https://github.com/owner/${longName}`)).toBeNull();
  });
});

describe('github.ts - normalizeStackTags', () => {
  it('trims whitespace and removes invalid lengths', () => {
    const raw = ['  React ', '', '   ', 'A'.repeat(25), 'TypeScript'];
    expect(normalizeStackTags(raw)).toEqual(['React', 'TypeScript']);
  });

  it('deduplicates case-insensitively preserving first casing', () => {
    const raw = ['React', 'react', 'REACT', 'TypeScript', 'typescript'];
    expect(normalizeStackTags(raw)).toEqual(['React', 'TypeScript']);
  });

  it('enforces maximum 8 tags', () => {
    const raw = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    expect(normalizeStackTags(raw)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('drops non-string values', () => {
    const raw = ['React', 123, null, undefined, {}, true, 'Tailwind'];
    expect(normalizeStackTags(raw)).toEqual(['React', 'Tailwind']);
  });

  it('handles comma-separated string input', () => {
    expect(normalizeStackTags('React, Vite, TypeScript')).toEqual(['React', 'Vite', 'TypeScript']);
  });

  it('returns empty array for non-array/non-string input', () => {
    expect(normalizeStackTags(null)).toEqual([]);
    expect(normalizeStackTags(undefined)).toEqual([]);
    expect(normalizeStackTags(42)).toEqual([]);
  });
});

describe('github.ts - detectStackFromManifests', () => {
  it('detects dependencies from package.json', () => {
    const files = {
      'package.json': JSON.stringify({
        dependencies: {
          react: '^19.0.0',
          next: '^14.0.0',
          '@prisma/client': '^5.0.0',
          tailwindcss: '^4.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          vite: '^5.0.0',
        },
      }),
    };

    const stack = detectStackFromManifests(files);
    expect(stack).toContain('React');
    expect(stack).toContain('Next.js');
    expect(stack).toContain('Prisma');
    expect(stack).toContain('Tailwind CSS');
    expect(stack).toContain('TypeScript');
    expect(stack).toContain('Vite');
  });

  it('detects dependencies from requirements.txt and pyproject.toml', () => {
    const files = {
      'requirements.txt': `
        fastapi==0.110.0
        celery>=5.3.0
        pandas
      `,
      'pyproject.toml': `
        [tool.poetry.dependencies]
        python = "^3.11"
        torch = "^2.0.0"
      `,
    };

    const stack = detectStackFromManifests(files);
    expect(stack).toContain('Python');
    expect(stack).toContain('FastAPI');
    expect(stack).toContain('Celery');
    expect(stack).toContain('Pandas');
    expect(stack).toContain('PyTorch');
  });

  it('detects Flutter from pubspec.yaml', () => {
    const files = {
      'pubspec.yaml': 'name: my_app\nflutter:\n  uses-material-design: true',
    };
    const stack = detectStackFromManifests(files);
    expect(stack).toContain('Flutter');
    expect(stack).toContain('Dart');
  });

  it('detects Java, Kotlin, Android, Spring Boot from Gradle and Maven', () => {
    const gradleFiles = {
      'build.gradle': `
        plugins {
          id 'org.springframework.boot' version '3.2.0'
          id 'org.jetbrains.kotlin.jvm'
        }
      `,
    };
    const gradleStack = detectStackFromManifests(gradleFiles);
    expect(gradleStack).toContain('Java');
    expect(gradleStack).toContain('Kotlin');
    expect(gradleStack).toContain('Spring Boot');

    const mavenFiles = {
      'pom.xml': '<project><dependencies><dependency><groupId>org.springframework.boot</groupId></dependency></dependencies></project>',
    };
    const mavenStack = detectStackFromManifests(mavenFiles);
    expect(mavenStack).toContain('Java');
    expect(mavenStack).toContain('Spring Boot');
  });

  it('detects Rust and crates from Cargo.toml', () => {
    const files = {
      'Cargo.toml': `
        [dependencies]
        axum = "0.7"
        tokio = { version = "1.0", features = ["full"] }
      `,
    };
    const stack = detectStackFromManifests(files);
    expect(stack).toContain('Rust');
    expect(stack).toContain('Axum');
    expect(stack).toContain('Tokio');
  });

  it('detects Go and packages from go.mod', () => {
    const files = {
      'go.mod': `
        module example.com/app
        go 1.22
        require github.com/gin-gonic/gin v1.9.1
      `,
    };
    const stack = detectStackFromManifests(files);
    expect(stack).toContain('Go');
    expect(stack).toContain('Gin');
  });

  it('handles malformed package.json gracefully without throwing', () => {
    const files = {
      'package.json': '{ this is not valid json',
    };
    expect(() => detectStackFromManifests(files)).not.toThrow();
  });
});

describe('github.ts - suggestCategory', () => {
  it('suggests Mobile App for mobile frameworks', () => {
    expect(suggestCategory(['Flutter', 'Dart'], [])).toBe('Mobile App');
    expect(suggestCategory(['React Native'], ['JavaScript'])).toBe('Mobile App');
  });

  it('suggests Data / ML for data science tools', () => {
    expect(suggestCategory(['Python', 'PyTorch', 'Pandas'], ['Python'])).toBe('Data / ML');
  });

  it('suggests Game for game engines', () => {
    expect(suggestCategory(['Phaser', 'JavaScript'], ['JavaScript'])).toBe('Game');
    expect(suggestCategory(['Godot'], ['GDScript'])).toBe('Game');
  });

  it('suggests CLI Tool for CLI libraries', () => {
    expect(suggestCategory(['Go', 'Cobra'], ['Go'])).toBe('CLI Tool');
  });

  it('suggests Library for packages and SDKs', () => {
    expect(suggestCategory(['TypeScript', 'Library'], ['TypeScript'])).toBe('Library');
  });

  it('suggests API / Backend for backend frameworks', () => {
    expect(suggestCategory(['Express', 'PostgreSQL'], ['TypeScript'])).toBe('API / Backend');
    expect(suggestCategory(['FastAPI', 'Python'], ['Python'])).toBe('API / Backend');
    expect(suggestCategory(['Spring Boot'], ['Java'])).toBe('API / Backend');
  });

  it('suggests Web App for frontend tools', () => {
    expect(suggestCategory(['React', 'Tailwind CSS', 'Vite'], ['TypeScript'])).toBe('Web App');
    expect(suggestCategory(['Vue', 'Vite'], ['JavaScript'])).toBe('Web App');
  });
});

describe('github.ts - validateAnalysisResult', () => {
  const validData = {
    name: 'email-worker',
    description: 'Background worker queue for email dispatch.',
    stack: ['Python', 'Celery', 'Redis'],
    category: 'API / Backend',
    lastPushedAt: '2026-01-15T12:00:00Z',
    source: 'github+ai',
    repoUrl: 'https://github.com/my-org/email-worker',
  };

  it('validates a completely valid object', () => {
    const result = validateAnalysisResult({
      ...validData,
      aiProviderName: 'Groq',
      notice: 'Test notice',
    });
    expect(result).not.toBeNull();
    expect(result?.name).toBe('email-worker');
    expect(result?.description).toBe('Background worker queue for email dispatch.');
    expect(result?.stack).toEqual(['Python', 'Celery', 'Redis']);
    expect(result?.category).toBe('API / Backend');
    expect(result?.source).toBe('github+ai');
    expect(result?.aiProviderName).toBe('Groq');
    expect(result?.notice).toBe('Test notice');
  });

  it('validates stringified JSON and normalizes case-insensitive category', () => {
    const jsonString = JSON.stringify({
      ...validData,
      category: 'web app',
      source: 'github-only',
    });
    const result = validateAnalysisResult(jsonString);
    expect(result).not.toBeNull();
    expect(result?.category).toBe('Web App');
    expect(result?.source).toBe('github-only');
  });

  it('rejects invalid names', () => {
    expect(validateAnalysisResult({ ...validData, name: 'a' })).toBeNull(); // < 2 chars
    expect(validateAnalysisResult({ ...validData, name: 'x'.repeat(61) })).toBeNull(); // > 60 chars
    expect(validateAnalysisResult({ ...validData, name: 123 })).toBeNull();
    expect(validateAnalysisResult({ ...validData, name: '' })).toBeNull();
  });

  it('rejects invalid descriptions', () => {
    expect(validateAnalysisResult({ ...validData, description: '' })).toBeNull();
    expect(validateAnalysisResult({ ...validData, description: 'x'.repeat(501) })).toBeNull();
    expect(validateAnalysisResult({ ...validData, description: null })).toBeNull();
  });

  it('rejects empty or invalid stacks', () => {
    expect(validateAnalysisResult({ ...validData, stack: [] })).toBeNull();
    expect(validateAnalysisResult({ ...validData, stack: [''] })).toBeNull();
    expect(validateAnalysisResult({ ...validData, stack: [123, null] })).toBeNull();
  });

  it('rejects invalid categories', () => {
    expect(validateAnalysisResult({ ...validData, category: 'Blockchain' })).toBeNull();
    expect(validateAnalysisResult({ ...validData, category: 999 })).toBeNull();
  });

  it('rejects invalid sources', () => {
    expect(validateAnalysisResult({ ...validData, source: 'ai-magic' })).toBeNull();
    expect(validateAnalysisResult({ ...validData, source: '' })).toBeNull();
  });

  it('rejects invalid repo URLs', () => {
    expect(validateAnalysisResult({ ...validData, repoUrl: 'https://gitlab.com/test/repo' })).toBeNull();
    expect(validateAnalysisResult({ ...validData, repoUrl: 'not a url' })).toBeNull();
  });

  it('handles invalid lastPushedAt gracefully by leaving it undefined', () => {
    const result = validateAnalysisResult({ ...validData, lastPushedAt: 'not-a-date' });
    expect(result).not.toBeNull();
    expect(result?.lastPushedAt).toBeUndefined();
  });

  it('rejects non-object or unparseable inputs', () => {
    expect(validateAnalysisResult(null)).toBeNull();
    expect(validateAnalysisResult(undefined)).toBeNull();
    expect(validateAnalysisResult(42)).toBeNull();
    expect(validateAnalysisResult('{ broken json')).toBeNull();
  });
});

describe('github.ts - generateLocalRepoFallback', () => {
  it('extracts repository name from GitHub URL into fallback RepoAnalysis', () => {
    const fallback = generateLocalRepoFallback('https://github.com/facebook/react');
    expect(fallback.name).toBe('react');
    expect(fallback.category).toBe('Other');
    expect(fallback.source).toBe('github-only');
    expect(fallback.repoUrl).toBe('https://github.com/facebook/react');
    expect(fallback.notice).toContain('Backend service');
  });

  it('uses custom notice when provided', () => {
    const fallback = generateLocalRepoFallback('https://github.com/acme/tool', 'Custom static warning');
    expect(fallback.name).toBe('tool');
    expect(fallback.notice).toBe('Custom static warning');
  });
});
