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

	async queryFiled(nodeId: string) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			fields(first: 20) {
				nodes {
					... on ProjectV2Field {
							id
							name
							dataType
						}
					... on ProjectV2IterationField {
						id
						name
						configuration {
							iterations {
								startDate
								id
							}
						}
					}
					... on ProjectV2SingleSelectField {
						id
						name
						options {
							id
							name
						}
					}
				}
			}
		}
	}
}`;
		return this.github.graphql(query);
	}

	async queryFiledBySingleSelectField(nodeId: string, filedName: string) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			field(name: "${filedName}") {
				... on ProjectV2SingleSelectField {
					id
					name
					options {
						id
						name
					}
				}
			}
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
					fieldValues(first: 8) {
						nodes{
							...on ProjectV2ItemFieldTextValue {
								text
								field {
									...on ProjectV2FieldCommon {
										name
									}
								}
							}
							...on ProjectV2ItemFieldDateValue {
								date
								field {
									...on ProjectV2FieldCommon {
										name
									}
								}
							}
							...on ProjectV2ItemFieldSingleSelectValue {
								id
								name
								field {
									...on ProjectV2FieldCommon {
										id
										name
									}
								}
							}
						}
					}
					content{
						...on DraftIssue {
                  			title
                  			body
                		}
						...on Issue {
							title
							repository {
								name
								owner {
									login
								}
								url
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
		const query = `\
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
		const query = `\
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

	async updateIssueField(
		projectNodeId: string,
		itemNodeId: string,
		fieldNodeId: string,
		valueNodeId: string,
	) {
		const query = `\
mutation {
    updateProjectV2ItemFieldValue(
		input: {
			projectId: "${projectNodeId}"
			itemId: "${itemNodeId}"
			fieldId: "${fieldNodeId}"
			value: {
				singleSelectOptionId: "${valueNodeId}"
			}
		}
	) {
		projectV2Item {
			id
		}
	}
}
`;
		return this.github.graphql(query);
	}

	async updateIssueFields(
		projectNodeId: string,
		itemNodeId: string,
		fieldNodes: {
			fieldId: string;
			value:
				| { singleSelectOptionId: string }
				| { text: string }
				| { date: Date }
				| { number: number }
				| { iterationId: string };
		}[],
	) {
		const query = `\
mutation ($projectId: ID!, $itemId: ID!, $fieldId: ID!, $fieldValues: ProjectV2FieldValue!) {
    updateProjectV2ItemFieldValue(
		input: {
			projectId: $projectId
			itemId: $itemId
			fieldId: $fieldId
			value: $fieldValues
		}
	) {
		projectV2Item {
			id
		}
	}
}
`;
		const req = fieldNodes.map((fieldNode) => {
			return this.github.graphql({
				query,
				projectId: projectNodeId,
				itemId: itemNodeId,
				fieldId: fieldNode.fieldId,
				fieldValues: fieldNode.value,
			});
		});
		return Promise.all(req);
	}
}
