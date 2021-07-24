#
# Docker image for building and testing microservices
#

FROM node:14-alpine

# ld-linux-x86-64 is required by uWebsocket
RUN apk update && apk add --no-cache libc6-compat
RUN ln -s /lib64/ld-linux-x86-64.so.2 /lib/ld-linux-x86-64.so.2

# install JDK
RUN apk add openjdk11

# install OpenAPI tools
RUN npm install --global @openapitools/openapi-generator-cli
RUN openapi-generator-cli version
