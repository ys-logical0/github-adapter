import { Octokit } from "octokit";

export class ProjectGraphAdapter {
	constructor(
		private github: Octokit,
		private owner: string,
		private category: string,
	) {}
	async queryProject(projectId: number) {
		const query = `
query {
	${this.category}(login: "${this.owner}") {
		projectV2(number: ${projectId}) {
			id
			title
		}
	}
}`;
		return this.github.graphql(query);
	}

	async queryNode(nodeId: string) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			items(first: 20) {
				nodes{
					id
					content{
						...on Issue {
							title
							projectItems(first: 20) {
								nodes {
									id
									project {
										id
										title
										number
									}
								}
							}
						}
					}
				}
			}
		}
	}
}`;
		return this.github.graphql(query);
	}

	async addDraftIssue(nodeId: string) {
		const query = `\n
mutation {
    addProjectV2DraftIssue(input: {projectId: "${nodeId}" title: "Test Title" body: "my body"}) {
    	projectItem {
    		id
    	}
    }
  }
`;
		return this.github.graphql(query);
	}

	async linkIssue(projectNodeId: string, issueNodeId: string) {
		const query = `\n
mutation {
    addProjectV2ItemById(input: {projectId: "${projectNodeId}" contentId: "${issueNodeId}"}) {
    	item {
    		id
    	}
    }
  }
`;
		return this.github.graphql(query);
	}
}
