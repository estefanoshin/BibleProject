# Package first: ./mvnw -DskipTests package
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY target/BibleAPI-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 5010

ENTRYPOINT ["java", "-jar", "app.jar"]
