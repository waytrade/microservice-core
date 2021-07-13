# microservice-core

[![Test and Publish](https://github.com/waytrade/microservice-core/actions/workflows/test_publish.yml/badge.svg)](https://github.com/waytrade/microservice-core/actions/workflows/test_publish.yml)
[![Test Report](./assets/test-results.svg)](https://waytrade.github.io/microservice-core/coverage/jest) [![Core Coverage](./test-report/coverage/coverage.svg)](https://waytrade.github.io/microservice-core/coverage/lcov-report)

---

Core-library for microservice implementations.

We use this library as core of our microservice Apps and it is OSS so you don't need to write it again. No questions will be answered, no support will be given, no feature-request will be accepted. Use it - or fork it and roll your own :)

See https://github.com/waytrade/ib-api-service for an App that uses it.

Provides:

- An App base-class, that handles server, services and controllers boot and shutdown.
- A HTTP/REST and WebSocket Server on uWebsocket.
- Decorators (@get, @post, ..) to route HTTP requested into your controllers
- An OpenAPI Generator to create an openapi.json for your service App.
- A SwaggerUI on /index.html to browse and test your REST API.
- Decorators {@summary, @model, @attribute, ..} to describe your interfaces and model for the OpenApi Generator.

## Preparation

    $ yarn global add @openapitools/openapi-generator-cli

## Usage

    $ yarn add @waytrade/microservice-core

update:

    $ yarn upgrade @waytrade/microservice-core@^
