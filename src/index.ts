import { Command } from "commander";
import "dotenv/config";
import { Octokit } from "octokit";
import { ProjectGraphAdapter } from "./adapter/project-graph.js";
import { RepositoryGraphAdapter } from "./adapter/repository-graph.js";

const app = new Command();
function query() {
	const ghKey = process.env.GH_KEY ?? "";
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new ProjectGraphAdapter(
		new Octokit({ auth: ghKey }),
		ghOwner,
		ghPrjCategory,
	);
	github
		.queryProject(ghPrjNum)
		.then((result) => {
			console.log(JSON.stringify(result));
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
}

function node(nodeId: string) {
	const ghKey = process.env.GH_KEY ?? "";
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new ProjectGraphAdapter(
		new Octokit({ auth: ghKey }),
		ghOwner,
		ghPrjCategory,
	);
	github
		.queryNode(nodeId)
		.then((result) => {
			console.log(JSON.stringify(result));
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
}

function addProjectsIssue(nodeId: string) {
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghKey = process.env.GH_KEY ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new ProjectGraphAdapter(
		new Octokit({ auth: ghKey }),
		ghOwner,
		ghPrjCategory,
	);
	github
		.addDraftIssue(nodeId)
		.then((result) => {
			console.log(JSON.stringify(result));
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
}

function addRepositoryIssue(projectNodeId: string) {
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghKey = process.env.GH_KEY ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new Octokit({ auth: ghKey });
	const githubRp = new RepositoryGraphAdapter(github, ghOwner, ghPrjCategory);
	const githubPrj = new ProjectGraphAdapter(github, ghOwner, ghPrjCategory);
	const pjNode = githubPrj.queryProject(ghPrjNum).catch((err) => {
		console.log(JSON.stringify(err));
	});
	const issueNode = githubRp
		.queryRepository(ghRepo)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then((result: any) => {
			console.log(JSON.stringify(result));
			return githubRp.addIssue(result.repository.id);
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
	Promise.all([pjNode, issueNode])
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then(([res1, res2]: any[]) => {
			return githubPrj.linkIssue(
				res1[ghPrjCategory].projectV2.id,
				res2.createIssue.issue.id,
			);
		})
		.then((result) => {
			console.log(JSON.stringify(result));
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
}

app.command("query").action(async () => {
	query();
});

app
	.command("node")
	.argument("[nodeId]", "github project node id")
	.action(async (nodeId) => {
		node(nodeId);
	});

app
	.command("addDraft")
	.argument("[nodeId]", "github project node id")
	.action(async (nodeId) => {
		addProjectsIssue(nodeId);
	});

app
	.command("addIssue")
	.argument("<nodeId>", "github project node id")
	.action(async (nodeId) => {
		addRepositoryIssue(nodeId);
	});

app.parse(process.argv);
