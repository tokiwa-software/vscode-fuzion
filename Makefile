build-vsix:
	npm i
	npm run vscode:package

publish_marketplace_visualstudio:
	npx vsce publish

publish_open_vsx:
	npm run ovsx-publish
