# il2mg - Mission Generator

Procedural and dynamic single-player mission generator for [IL-2 Sturmovik](https://il2sturmovik.com/) combat flight simulator.

## Setup environment

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Install latest [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/). As an optional step also consider installing [ESLint](https://eslint.org/docs/user-guide/integrations#editors) and [EditorConfig](http://editorconfig.org/#download) extensions for your favorite editor - this will help you apply project specific source code style rules from within the editor.

### Install dependencies

Clone this repository with git and install third-party dependencies:

```
yarn install
```

### Build data files

Build all source data files inside */data* directory:

```
yarn build
```

If you ever make any changes to data files in this directory - make sure to run `yarn build` again.

## Run application

You can run this application with a GUI or a simple command-line interface.

### GUI application

```
yarn start
```

You can then use <kbd>F5</kbd> key to reload application and <kbd>F12</kbd> to toggle developer tools.

### Command-line application

```
node . test -D
```

When working with non-GUI related code it is more practical to use the command-line interface - as this allows you to use *seed* parameter which can be used to re-create exact same mission and easily test your changed code.

Use `--help` command-line parameter to see a list of supported options.

## Contributing

Please refer to the [Wiki](https://github.com/simast/il2mg/wiki) pages for some additional information on existing project architecture.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
