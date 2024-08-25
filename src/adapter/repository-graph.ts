import type { Octokit } from "octokit";
import { generateRandomColor } from "../util/color.js";

export type CommonNode = {
	id: string;
	name: string;
};

export type RepositoryLabelNode = {
	[key in string]: CommonNode | never;
};

export type CreateLabelNode = {
	[key in string]: { label: CommonNode };
};

export type RepositoryNode = {
	repository: CommonNode;
};

export type ProjectIdNodeWithLabel = {
	node: RepositoryLabelNode;
};

export type RepositoryNameNodeWithLabel = {
	repository: RepositoryLabelNode;
};

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
		name
    }
}
`;
		return this.github.graphql(query);
	}

	async addIssue(
		nodeId: string,
		title: string,
		body: string,
		labels: string[],
	) {
		const query = `\
mutation($repositoryId: ID!, $title: String!, $body: String!,$labels: [ID!]) {
	createIssue(input: {
		repositoryId: $repositoryId,
		title: $title,
		body: $body
		labelIds: $labels
	}) {
		issue {
			id
			number
			title
			url
	}
}}`;

		const labelResult = await this.queryLabelsById(nodeId, labels);
		const nods = Object.values(labelResult.node);
		const labelStates = labels.reduce(
			(acc, label) => {
				const r = nods.find((n) => n && n.name === label);
				if (!r) {
					acc.nonIdsTags.push(label);
				} else {
					acc.existsIds.push(r.id);
				}
				return acc;
			},
			{
				existsIds: [] as string[],
				nonIdsTags: [] as string[],
			},
		);

		if (labelStates.nonIdsTags.length > 0) {
			const newLabels = await this.createLabels(nodeId, labelStates.nonIdsTags);
			labelStates.existsIds.push(
				...Object.values(newLabels).map((l) => l.label.id),
			);
		}

		return this.github.graphql(query, {
			repositoryId: nodeId,
			title,
			body,
			labels: labelStates.existsIds,
		});
	}

	async queryLabels(
		repositoryName: string,
		labels: string[],
	): Promise<RepositoryNameNodeWithLabel> {
		const labelsQuery = labels.map((label, index) => {
			return `
el${index}:label(name: "${label}") {
	id
	name
}
`;
		});

		const query = `
query {
    repository(owner: "${this.owner}", name: "${repositoryName}") {
		${labelsQuery.join("\n")}
    }
}
`;

		return this.github.graphql(query);
	}

	async queryLabelsById(
		repositoryId: string,
		labels: string[],
	): Promise<ProjectIdNodeWithLabel> {
		const labelsQuery = labels.map((label, index) => {
			return `
el${index}:label(name: "${label}") {
	id
	name
}
`;
		});

		const query = `
query($id: ID!) {
    node(id: $id) {
		... on Repository {
			${labelsQuery.join("\n")}
		}
    }
}
`;

		return this.github.graphql(query, { id: repositoryId });
	}

	async createLabels(
		repositoryId: string,
		labels: string[],
	): Promise<CreateLabelNode> {
		const variablesParts: string[] = [];
		const bodyParts: string[] = [];
		type LabelInput = {
			repositoryId: string;
			color: string;
			name: string;
		};
		const inputVariables: Record<string, LabelInput> = {};
		labels.forEach((label, index) => {
			variablesParts.push(`$el${index}: CreateLabelInput!`);
			bodyParts.push(`
el${index}:createLabel(input: $el${index}) {
	label {
		id
		name
	}
}
`);
			inputVariables[`el${index}`] = {
				repositoryId: repositoryId,
				color: generateRandomColor(),
				name: label,
			};
		});

		const query = `
mutation(${variablesParts.join(",")}) {
	${bodyParts.join("\n")}
}
`;
		return this.github.graphql(query, inputVariables);
	}
}
