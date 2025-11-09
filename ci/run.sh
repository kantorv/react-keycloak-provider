
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




echo "Creating demo user"
USER_NAME="demo3"
USER_EMAIL="$USER_NAME@example.com"
USER_PASSWORD="demo@pass"

USER_FIRSTNAME="Hello"
USER_LASTNAME="World"


KEYCLOAK_URL="http://localhost:8282"
KEYCLOAK_ADMIN_PASSWORD="change_me"

MAX_RETRIES=10
SLEEP_TIME=5
counter=0


 

while [ $counter -lt $MAX_RETRIES ]; do
    # Run curl command and capture response
    response=$(
          curl -s \
          -d "client_id=admin-cli" \
          -d "username=admin" \
          -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
          -d "grant_type=password" \
          "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token"
    )
    exit_code=$?
    
    # Check if curl failed with connection reset (exit code 56)
    if [ $exit_code -eq 56 ]; then
        counter=$((counter + 1))
        echo "Connection reset (attempt $counter/$MAX_RETRIES). Retrying in ${SLEEP_TIME}s..."
        sleep $SLEEP_TIME
    elif [ $exit_code -eq 0 ]; then
        # Curl succeeded, check response length
        if [ -z "$response" ]; then
            # Response is empty
            counter=$((counter + 1))
            echo "Empty response (attempt $counter/$MAX_RETRIES). Retrying in ${SLEEP_TIME}s..."
            sleep $SLEEP_TIME
        else
            # Response has content - success!
            echo "$response"
            ADMIN_BEARER=$(echo $response | jq -r ".access_token")
            counter=$MAX_RETRIES
        fi
    else
        # Other error
        echo "Curl failed with exit code $exit_code"
        exit $exit_code
    fi
done

 
 
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
 


curl --location --request POST $KEYCLOAK_URL/realms/demo/protocol/openid-connect/userinfo \
--header "authorization: Bearer $ACCESS_TOKEN"



# python3 -m http.server 3000 --bind localhost  --directory ./build