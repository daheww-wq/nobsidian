import { createOctokit } from './client';

interface GetFileOptions {
  token: string;
  owner: string;
  repo: string;
  path: string;
}

interface PutFileOptions extends GetFileOptions {
  content: string; // utf-8 string (will be base64-encoded)
  message: string;
  sha?: string; // required for updates
}

export async function getFile({ token, owner, repo, path }: GetFileOptions) {
  const octokit = createOctokit(token);
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  if (Array.isArray(data)) throw new Error('Path is a directory');
  return data as { content: string; sha: string; encoding: string };
}

export async function putFile({ token, owner, repo, path, content, message, sha }: PutFileOptions) {
  const octokit = createOctokit(token);
  const encoded = Buffer.from(content, 'utf-8').toString('base64');
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encoded,
    sha,
  });
  return data;
}

export async function deleteFile({
  token,
  owner,
  repo,
  path,
  sha,
  message,
}: GetFileOptions & { sha: string; message: string }) {
  const octokit = createOctokit(token);
  await octokit.repos.deleteFile({ owner, repo, path, sha, message });
}

export async function getRepoTree(token: string, owner: string, repo: string, branch: string) {
  const octokit = createOctokit(token);
  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: 'true',
  });
  return data.tree;
}

export async function initNotegraphConfig(
  token: string,
  owner: string,
  repo: string,
  branch: string
) {
  const path = '.notegraph/config.json';
  const config = { version: '1', createdAt: new Date().toISOString() };

  try {
    // check if already exists
    await getFile({ token, owner, repo, path });
    return; // already initialized
  } catch {
    // file doesn't exist — create it
    await putFile({
      token,
      owner,
      repo,
      path,
      content: JSON.stringify(config, null, 2),
      message: '[dohohon] init config',
    });
  }
}
