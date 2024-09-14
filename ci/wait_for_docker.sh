sh -c 'docker compose -f docker-compose.keycloak.yml  logs -f | { sed "/Running the server in development mode. DO NOT use this configuration in production/ q" && kill $$ ;}'
exit 0