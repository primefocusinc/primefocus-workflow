FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY Prime_Vision_Focus_GiveCamp/PVF_React_Frontend/package*.json ./
RUN npm ci
COPY Prime_Vision_Focus_GiveCamp/PVF_React_Frontend/ ./
RUN npm run build

FROM gradle:9.2-jdk17 AS build
WORKDIR /home/gradle/src
COPY --chown=gradle:gradle . .
RUN mkdir -p src/main/resources/static
COPY --from=frontend-build --chown=gradle:gradle /app/dist/ /home/gradle/src/src/main/resources/static/
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /home/gradle/src/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
