import type { Octokit } from "octokit";

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
			Status:field(name: "Status") {
				... on ProjectV2SingleSelectField {
					id
					name
					dataType
					options {
						id
						name
					}
				}
			}
			Iteration:field(name: "Iteration") {
				... on ProjectV2IterationField {
					id
					name
					dataType
					configuration{
						iterations {
							startDate
							id
							title
						}
					}
				}
			}
			Title:field(name: "Title") {
				... on ProjectV2Field {
					id
					name
					dataType
				}
			}
		}
	}
}`;
		return this.github.graphql(query);
	}

	async queryFiled(nodeId: string, after: string | null = null) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			fields(first: 20, after: "${after}") {
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
								title
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

	async queryFiledBySingleSelectField(nodeId: string, fieldName: string) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			field(name: "${fieldName}") {
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

	async queryProjectItemByIterationField(projectId: string, after: string | null = null) {
		const query = `
query {
	node(id: "${projectId}") {
		... on ProjectV2 {
			items(last: 100, after: "${after}") {
				nodes{
					id
					Status: fieldValueByName(name:"Status") {
						...on ProjectV2ItemFieldSingleSelectValue {
							id
							name
							optionId
						}
					}
					Iteration: fieldValueByName(name:"Iteration") {
						...on ProjectV2ItemFieldIterationValue {
							id
							title
							iterationId
							item {
								content{
									...on Issue{
										id
										title
										body
										closed
										url
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

	async queryNode(nodeId: string, after: string | null = null) {
		const query = `
query {
	node(id: "${nodeId}") {
		... on ProjectV2 {
			items(first: 20, after: "${after}") {
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
				pageInfo {
					endCursor
					startCursor
					hasNextPage
					hasPreviousPage
				}
				totalCount
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
		const variablesParts: string[] = [];
		const bodyParts: string[] = [];
		type UpdateInput = {
			projectId: string;
			itemId: string;
			fieldId: string;
			value:
				| { singleSelectOptionId: string }
				| { text: string }
				| { date: Date }
				| { number: number }
				| { iterationId: string };
		};
		const inputVariables: Record<string, UpdateInput> = {};
		fieldNodes.forEach((fieldNode, _) => {
			variablesParts.push(
				`$${fieldNode.fieldId}: UpdateProjectV2ItemFieldValueInput!`,
			);
			bodyParts.push(`\
			${fieldNode.fieldId}:updateProjectV2ItemFieldValue(
	input: $${fieldNode.fieldId}
) {
	projectV2Item {
		id
	}
}
`);
			inputVariables[`${fieldNode.fieldId}`] = {
				projectId: projectNodeId,
				itemId: itemNodeId,
				fieldId: fieldNode.fieldId,
				value: fieldNode.value,
			};
		});

		const query = `\
mutation (${variablesParts.join(",")}){
	${bodyParts.join("\n")}
}`;

		return this.github.graphql({
			query,
			...inputVariables,
		});
	}
}
