# Portfolio Client

This is an Angular client-only application optimized for GitHub Pages deployment.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

Optimize model first.
```bash
npm run optimize-model
```

Then build the project.
```bash
npm run build:prod
```

This will compile your project and store the build artifacts in the `dist/portfolio-client/browser/` directory, optimized for performance and speed.

## Local Preview

To preview the production build locally:

```bash
npm run preview
```

This will serve the built application on `http://localhost:8080`.

## TODO
* more cleanup
* either load data from url or remove signals
