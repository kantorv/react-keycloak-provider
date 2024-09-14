
#docker run --name keycloak_unoptimized -p 8282:8080 \
#        -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=change_me \
#        -v /path/to/realm/data:/opt/keycloak/data/import \
#        quay.io/keycloak/keycloak:latest \
#        start-dev --import-realm
#
#
docker compose -f docker-compose.keycloak.yml down
docker compose -f docker-compose.keycloak.yml up  -d --build  --force-recreate --remove-orphans
/bin/bash ./wait_for_docker.sh
echo "Service Ready!!"





USER_NAME="demo3"
USER_EMAIL="$USER_NAME@example.com"
USER_PASSWORD="demo@pass"

USER_FIRSTNAME="Hello"
USER_LASTNAME="World"


KEYCLOAK_URL="http://127.0.0.1:8282"
KEYCLOAK_ADMIN_PASSWORD="change_me"


ADMIN_BEARER=$(curl -s \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
  -d "grant_type=password" \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" | jq -r ".access_token")


#echo "ADMIN_BEARER: $ADMIN_BEARER"


resp1=$(
  curl -s -X POST $KEYCLOAK_URL/admin/realms/demo/users \
      -H "Authorization: Bearer ${ADMIN_BEARER}" \
      -H 'Content-Type: application/json' \
      -d '{"username": "'${USER_NAME}'", "email": "'${USER_EMAIL}'", "firstName": "'${USER_FIRSTNAME}'", "lastName": "'${USER_LASTNAME}'", "emailVerified":true, "enabled":true, "credentials" : [{"type" : "password","value":"'${USER_PASSWORD}'","temporary":false}]}' \
)


#resp2=$(
#curl -s -X GET $KEYCLOAK_URL/admin/realms/demo/users \
#    -H "Authorization: Bearer ${ADMIN_BEARER}" \
#    -H 'Content-Type: application/json'
#)
#
#
#cnt=$( echo $resp2 | jq ". | length")
#echo "Users created: $cnt"

resp=$(
curl -s -X POST $KEYCLOAK_URL/realms/demo/protocol/openid-connect/token \
   -H "Content-Type: application/x-www-form-urlencoded" \
   -d "username=$USER_NAME" \
   -d "password=$USER_PASSWORD" \
   -d "grant_type=password" \
   -d "client_id=react-client" \
   -d "scope=openid email profile"
 )

#echo "token: $resp"
ACCESS_TOKEN=$(echo ${resp} | jq -r ".access_token")
#echo "ACCESS_TOKEN:"
#echo $ACCESS_TOKEN



curl --location --request POST $KEYCLOAK_URL/realms/demo/protocol/openid-connect/userinfo \
--header "authorization: Bearer $ACCESS_TOKEN"



# python3 -m http.server 3000 --bind localhost  --directory ./build