#
# Docker image for building and testing microservices
#

FROM node:14-alpine

# install JDK
RUN apk add openjdk11

# install OpenAPI tools
RUN npm install --global @openapitools/openapi-generator-cli
RUN openapi-generator-cli version