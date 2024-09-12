# React Standalone Component Boilerplate

A boilerplate for developing standalone React components with Storybook and publishing them to npm.

## Features

- **Rollup**: Provides build with `esm`,`cjs`,`.d.ts`.
- **Release-it**: Github releases, npmjs publishing
- **Storybook**: Local development , deployment to Github Pages (optionally).


## Out the box support:
- **TypeScript**: Pre-configured for seamless integration.
- **Material-UI**: Compatible with MUI v5/v6.
- **SDLC**: There is a set of github actions, aims to implement `gitflow` model

## Getting Started


### Prequirements
-  **NPM publish token**
    
    Follow these steps if you're planning to push to npmjs/other registry 
    - **Generate an npm token**:
        - Go to [npmjs.com](https://npmjs.com), log in, and navigate to `Access Tokens`.
        - Create a new token of type `Classic`, and choose the `Automation` option.

    - **Test locally (⚠️ will override ~/.npmrc ⚠️)**:
        ```bash
        # make a backup before testing ci token in local env
        
        # backing up
        # $ cp ~/.npmrc ~/.npmrc.bak

        $ npm config set //registry.npmjs.org/:_authToken $NPM_PUBLISH_TOKEN
        $ npm publish
        
        # restoring
        # $ mv ~/.npmrc.bak ~/.npmrc
        ```

    - **GitHub Actions setup**:

        Add the `NPM_PUBLISH_TOKEN` as a secret in your GitHub repository/organization if you want to push releases via GitHub Actions.


-  **Storybook deploying to Github Pages**
    1. Go to `Repository Settings` -> `Actions` -> `General` -> `Workflow permissions`, enable `Read and write permissions` and  `Save`.

    2. Go to `Repository Settings` -> `Pages` -> `Build and deployment`, and set the `Source` to `GitHub Actions`.

-  **PR Labels**
    

### Installation

To create a new project from this template:

1. Click on the `Use this template` button in GitHub.
2. Clone the newly created repository:
    ```bash
    git clone git@github.com:yourusername/your-custom-lib.git
    cd your-custom-lib
    yarn install
    yarn storybook
    yarn build
    yarn release # make sure you have a valid NPM_PUBLISH_TOKEN
    
    # ci env simulate
    # yarn release --ci  --increment=patch
    ```

### Material UI
For creating custom MUI components, just install the needed dependencies
```bash
$ yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```
TODO: add color theme support


### Development

- **SDLC**: 
    - `gitflow`:
        - Push to `feature/*`, `hotfix/*`
            - triggers `.github/workflows/tests.yml`
        - Make PR to `development`
            - Set label: `patch`,`minor`,`major`  (necessary for calculating next version)
            - triggers `.github/workflows/semver-check.yml` when saved (checks if label above was set)
               
        - When `merged`:
            - triggers `.github/workflows/release.yml`
                - new `tag` created
                - new `github release`  created
                - new build pushed to `npmjs`
                - new `commit` pushed to `development` (⚠️ fails on protected branches )
                

        - TODO: support dev/rc tags


### Available Scripts

Here are the main scripts you can use:

#### `yarn storybook`

#### `yarn test`

Runs the test suite using `react-scripts`.

#### `yarn build`

Builds the component library using Rollup, outputting both `esm` and `cjs` formats.

#### `yarn release`

Prepares and publishes a new version to npm.



### Configuration

#### TypeScript (`tsconfig.json`)

The provided `tsconfig.json` contains several options related to generated `.d.ts` - required by `rollup-plugin-dts`
- `"declaration": true`
- `"declarationDir": "build/dts"`
- `"emitDeclarationOnly": true`





## Known Issues

- Release-it
    - **NPM Classic Token bypasses 2FA**: The token used for automated publishing bypasses two-factor authentication.
    - **GitHub Actions fail on protected branches**: If `git.commit === true` in the `release-it` configuration, the `release.yml` action will fail on protected branches. 
    To resolve this, disable branch protection for the `default` branch. 
     TODO: refactor flow without commiting to `default`  branch

## Inspiration

This project was inspired by:

- [TypeScript React Package Starter](https://github.com/TimMikeladze/typescript-react-package-starter)

## References
- [TypeScript library tips: Rollup your types!](https://medium.com/@martin_hotell/typescript-library-tips-rollup-your-types-995153cc81c7)
- [Creating a React Component Library with TypeScript, Storybook & Rollup](https://blog.cristiana.tech/creating-a-react-component-library-with-typescript-storybook-and-rollup)
- [How to Create a React Multi-package UI Library](https://medium.com/@maayan_37411/how-to-create-a-react-multi-package-ui-library-2ba6ae0909b6)

## Credits
- [Create React App](https://github.com/facebook/create-react-app)
- [StoryBook](https://storybook.js.org/)
- [Rollup](https://rollupjs.org/) 