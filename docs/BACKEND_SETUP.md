# Backend Setup Guide (Vercel & AI Provider)

This guide walks you step-by-step through configuring and testing the optional repository analysis backend (`api/analyze-repo.ts`) on Windows PowerShell.

---

## 1. How It Works
The Project Graveyard is local-first. All your core data stays in your browser's `localStorage`.

The only backend component is a single Vercel serverless function (`api/analyze-repo.ts`). When you click **Analyze** in the "Import from GitHub" dialog:
1. It queries public GitHub metadata (languages, manifest files, and README excerpts).
2. It sends this metadata to an OpenAI-compatible AI provider (such as Groq or xAI) to normalize suggestions (project name, description, tags, category).
3. If the AI provider is unavailable, rate-limited, or misconfigured, it cleanly falls back to deterministic GitHub-only analysis with an honest notice.

---

## 2. Setting Up `.env.local` for Local Testing

In the root of your project, create a file named `.env.local`. You can create it in Windows PowerShell by copying the example template:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Inside `.env.local`, configure your variable names:
```env
AI_API_KEY=your_key_here
AI_MODEL=your_model_name_here
AI_BASE_URL=https://api.groq.com/openai/v1
GITHUB_TOKEN=
```

> **Security Note**: Never commit `.env.local` to git or share your actual API keys. Git is already configured to ignore `.env*` files.

---

## 3. Getting an AI Provider Key & Picking a Model

### Option A: Free Groq Cloud (Recommended)
1. **Get an API Key**:
   - Go to [https://console.groq.com/keys](https://console.groq.com/keys) and create a free account.
   - Click **Create API Key**. Groq keys start with `gsk_`.
2. **Choose a Current Model**:
   - Check the active supported models in the [Groq Models Documentation](https://console.groq.com/docs/models).
   - Recommended general model: `llama-3.3-70b-versatile` (or `llama-3.1-8b-instant` for ultra-fast light inference).
3. **Configuration**:
   - `AI_API_KEY=gsk_...`
   - `AI_MODEL=llama-3.3-70b-versatile`
   - `AI_BASE_URL=https://api.groq.com/openai/v1` (optional; this is the default).

### Option B: xAI Grok
1. **Get an API Key**:
   - Go to [https://console.x.ai](https://console.x.ai) and generate an API key (starts with `xai-`).
2. **Configuration**:
   - `AI_API_KEY=xai-...`
   - `AI_MODEL=grok-2-latest`
   - `AI_BASE_URL=https://api.x.ai/v1`

---

## 4. Running the Backend Locally (`vercel dev`)

Because plain `npm run dev` only starts the Vite frontend, it does not execute serverless functions in the `api/` directory.

To test both frontend and serverless functions locally together:
1. Log in to Vercel (one-time):
   ```powershell
   npx vercel login
   ```
2. Start the local Vercel development server:
   ```powershell
   npx vercel dev
   ```
3. Open the provided local URL (usually `http://localhost:3000`) in your browser.

---

## 5. Adding Environment Variables in the Vercel Dashboard

When deploying to production on Vercel:
1. Open your project dashboard at [vercel.com](https://vercel.com).
2. Go to **Settings** > **Environment Variables**.
3. Add the following keys:
   - `AI_API_KEY`: your API key (`gsk_...` or `xai-...`)
   - `AI_MODEL`: your chosen model name (e.g. `llama-3.3-70b-versatile`)
   - `AI_BASE_URL`: `https://api.groq.com/openai/v1` (or `https://api.x.ai/v1`)
   - `GITHUB_TOKEN`: (optional) a personal GitHub token to avoid IP rate limits on public GitHub calls.
4. Select all target environments (**Production**, **Preview**, and **Development**).
5. **IMPORTANT**: You must **REDEPLOY** your project after saving or updating environment variables for them to be injected into running serverless instances.

---

## 6. Manual Testing Verification Checklist

After adding your keys and starting `vercel dev`:
- [ ] **Valid Public Repo**: Paste `https://github.com/facebook/react` or a personal repo. Click **Analyze**. Verify the badge shows `Suggested from GitHub data + AI (Groq), please review` and suggestions populate.
- [ ] **Non-Existent Repo**: Paste `https://github.com/nonexistent-user-12345/nonexistent-repo-99999`. Click **Analyze**. Verify an inline red error appears: "Repository not found or private (only public repos work)."
- [ ] **Junk URL**: Type `not-a-github-url` or `https://gitlab.com/test/repo`. Click **Analyze**. Verify inline validation error rejects non-GitHub URLs.
- [ ] **Missing AI Key / Rate Limit**: Test with empty `AI_API_KEY` or intentionally invalid key. Click **Analyze**. Verify deterministic GitHub analysis returns with badge `Suggested from GitHub data` and notice `AI suggestions unavailable right now, showing GitHub data only.`
- [ ] **"Will Replace" Diff Preview**: Type "My Existing Project" in the Name input, then analyze a repo. Verify the suggestion card displays `(will replace "My Existing Project")`.
- [ ] **Apply & Validation**: Click **Apply Selected**. Verify values transfer into the form inputs, and submittal validations work cleanly.
