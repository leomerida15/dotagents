const bunstartConfig = {
	repo: {
		apps: {
			vscode: { name: '@dotagents/vscode', dependsOn: ['diff'] },
		},
		packages: {
			diff: { name: '@dotagents/diff', dependsOn: [] },
			rule: { name: '@dotagents/rule', dependsOn: [] },
		},
	},
};

export default bunstartConfig;
