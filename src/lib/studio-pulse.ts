type GitHubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
};

type GitHubUser = {
  login: string;
  public_repos: number;
  followers: number;
};

export type StudioPulseData =
  | {
      source: "github";
      username: string;
      stats: {
        repos: number;
        followers: number;
      };
      repos: GitHubRepo[];
    }
  | {
      source: "fallback";
      title: string;
      description: string;
      integrations: string[];
    };

async function getGithubData(username: string): Promise<StudioPulseData | null> {
  try {
    const [userResponse, repoResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }),
    ]);

    if (!userResponse.ok || !repoResponse.ok) {
      return null;
    }

    const user = (await userResponse.json()) as GitHubUser;
    const repos = (await repoResponse.json()) as GitHubRepo[];

    return {
      source: "github",
      username: user.login,
      stats: {
        repos: user.public_repos,
        followers: user.followers,
      },
      repos,
    };
  } catch {
    return null;
  }
}

export async function getStudioPulse(): Promise<StudioPulseData> {
  const githubUsername = process.env.GITHUB_USERNAME?.trim();

  if (githubUsername) {
    const githubData = await getGithubData(githubUsername);

    if (githubData) {
      return githubData;
    }
  }

  return {
    source: "fallback",
    title: "已预留动态 API 接入位",
    description:
      "这个站点现在已经具备接入外部动态内容的结构。下一步可以直接接 GitHub、RSS、Newsletter、即刻或其他公开数据源。",
    integrations: ["GitHub 项目动态", "RSS 构建流", "Newsletter 订阅", "社交内容聚合"],
  };
}
