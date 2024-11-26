import { Command } from "commander";
import "dotenv/config";
import fs from "node:fs";
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

async function node(
	nodeId: string,
	option: {
		isField?: boolean;
		isIteration?: boolean;
	},
) {
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

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>

	const queryFunc = async (depth:number = 0, after: string | null = null): Promise<any[]> => {
		let query: any;
		let result: any[] = [];
		if (option.isField) {
			query = await github.queryFiled(nodeId, after);
		} else if (option.isIteration) {
			query = await github.queryProjectItemByIterationField(nodeId, after);
		} else {
			query = await github.queryNode(nodeId, after);
		}

		if (query.node.items.pageInfo.hasNextPage && depth < 5) {
			let queryRes = await queryFunc(depth+1, query.node.items.pageInfo.endCursor)
			result.push(...queryRes)
		}
		return result.concat(...query.node.items.nodes);
	}

	const result = await queryFunc()
	console.log(JSON.stringify(result));
}

function nodeQuerySelect(nodeId: string, filedName: string) {
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
		.queryFiledBySingleSelectField(nodeId, filedName)
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

function addRepositoryIssue() {
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
			return githubRp.addIssue(
				result.repository.id,
				"test",
				"1 line body\n 2 line body",
				["Ace"],
			);
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
	Promise.all([pjNode, issueNode])
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then(([res1, res2]: any[]) => {
			console.log(JSON.stringify(res1));
			console.log(JSON.stringify(res2));
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

function updateProjectIssueField(
	itemId: string,
	fieldId: string,
	valueId: string,
) {
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghKey = process.env.GH_KEY ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new Octokit({ auth: ghKey });
	const githubRp = new RepositoryGraphAdapter(github, ghOwner, ghPrjCategory);
	const githubPrj = new ProjectGraphAdapter(github, ghOwner, ghPrjCategory);
	const pjNode = githubPrj
		.queryProject(ghPrjNum)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then((result: any) => {
			console.log(JSON.stringify(result));
			return githubPrj.updateIssueField(
				result[ghPrjCategory].projectV2.id,
				itemId,
				fieldId,
				valueId,
			);
		})
		.catch((err) => {
			console.log(JSON.stringify(err));
		});
}

function updateProjectIssueFields(itemId: string, filePath: string) {
	const ghOwner = process.env.GH_OWNER ?? "";
	const ghKey = process.env.GH_KEY ?? "";
	const ghRepo = process.env.GH_REPO ?? "";
	const ghPrjCategory = process.env.PROJECT_CATEGORY ?? "user";
	const ghPrjNum = +(process.env.GH_PROJECT ?? 1);
	const github = new Octokit({ auth: ghKey });
	const jsonData = fs.readFileSync(filePath, "utf8");
	const json = JSON.parse(jsonData);
	if (!json.fields) {
		console.log("fields is required");
		return;
	}
	const githubPrj = new ProjectGraphAdapter(github, ghOwner, ghPrjCategory);
	const pjNode = githubPrj
		.queryProject(ghPrjNum)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then((result: any) => {
			console.log(JSON.stringify(result));
			return githubPrj.updateIssueFields(
				result[ghPrjCategory].projectV2.id,
				itemId,
				json.fields,
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
	await query();
});

app
	.command("node")
	.argument("[nodeId]", "github project node id")
	.option("-f, --field", "query field")
	.option("-i, --iteration", "query iteration")
	.action(async (nodeId, options) => {
		await node(nodeId, {
			isField: options.field,
			isIteration: options.iteration,
		});
	});

app
	.command("nodeQuery")
	.argument("[nodeId]", "github project node id")
	.option("-n, --name <field name>", "field name")
	.option("-s, --select", "query single select field")
	.action(async (nodeId, options) => {
		if (options.select) {
			nodeQuerySelect(nodeId, options.name);
		} else {
			node(nodeId, {});
		}
	});

app
	.command("addDraft")
	.argument("[nodeId]", "github project node id")
	.action(async (nodeId) => {
		await addProjectsIssue(nodeId);
	});

app.command("addIssue").action(async () => {
	await addRepositoryIssue();
});

app
	.command("updateIssueFiled")
	.option("-i, --itemId <itemId>", "github project issue id")
	.option("-f, --fieldId <fieldId>", "github project field id")
	.option("-v, --valueId <valueId>", "github project value id")
	.action(async (options) => {
		await updateProjectIssueField(
			options.itemId,
			options.fieldId,
			options.valueId,
		);
	});

app
	.command("updateIssueFields")
	.option("--file <filePath>", "path file json path")
	.argument("<itemId>", "github project issue id")
	.action(async (itemId, options) => {
		await updateProjectIssueFields(itemId, options.file);
	});

app.parse(process.argv);
