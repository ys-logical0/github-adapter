import type { Octokit } from "octokit";

export class RepositoryGraphAdapter {
	constructor(
		private github: Octokit,
		private owner: string,
		private category: string,
	) {}
	async queryRepository(repositoryName: string) {
		const query = `
query {
    repository(owner: "${this.owner}", name: "${repositoryName}") {
        id
    }
}
`;
		return this.github.graphql(query);
	}

	async addIssue(nodeId: string) {
		const query = `\n
mutation {
	createIssue(input: {repositoryId: "${nodeId}", title: "Test", body: "Test Body"}) {
		issue {
			id
			number
			title
			url
		}
	}
}
	`;
		return this.github.graphql(query);
	}
}
