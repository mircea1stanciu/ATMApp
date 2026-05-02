const { defineConfig } = require('cypress')
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor')
const webpack = require('@cypress/webpack-preprocessor')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3003',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.{cy.{js,jsx,ts,tsx},feature}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    async setupNodeEvents(on, config) {
      // This is required for the preprocessor to be able to generate JSON reports after each run
      await addCucumberPreprocessorPlugin(on, config)

      // Configure webpack with cucumber loader and babel
      on(
        'file:preprocessor',
        webpack({
          webpackOptions: {
            resolve: {
              extensions: ['.ts', '.js'],
            },
            module: {
              rules: [
                {
                  test: /\.feature$/,
                  use: [
                    {
                      loader: '@badeball/cypress-cucumber-preprocessor/webpack',
                      options: config,
                    },
                  ],
                },
                {
                  test: /\.ts$/,
                  exclude: [/node_modules/],
                  use: [
                    {
                      loader: 'ts-loader',
                      options: {
                        transpileOnly: true,
                      },
                    },
                  ],
                },
                {
                  test: /\.js$/,
                  exclude: [/node_modules/],
                  use: [
                    {
                      loader: 'babel-loader',
                      options: {
                        presets: [
                          ['@babel/preset-env', {
                            modules: 'auto'
                          }]
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          },
        })
      )

      return config
    },
  },
  env: {
    apiUrl: 'http://localhost:8002/api',
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
})
