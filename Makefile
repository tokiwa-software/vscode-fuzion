build-vsix:
	npm i
	npm run vscode:package

publish:
	npx vsce publish
