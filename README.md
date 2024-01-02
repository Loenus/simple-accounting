### Simple accounting

docker compose using docker hub (and not cloning this repo)

```yaml
version: '3.8'

services:

  mongodb:
    image: mongo:5.0.2
    container_name: $MONGODB_HOST
    restart: unless-stopped
    env_file: ./.env
    environment:
      - MONGO_INITDB_ROOT_USERNAME=$MONGODB_USER
      - MONGO_INITDB_ROOT_PASSWORD=$MONGODB_PASSWORD
    ports:
      - $MONGODB_LOCAL_PORT:$MONGODB_DOCKER_PORT
    volumes:
      - db:/data/db

  mongo-express:
    image: mongo-express:1.0.0-20-alpine3.18
    container_name: simple-accounting-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=$MONGODB_USER
      - ME_CONFIG_MONGODB_ADMINPASSWORD=$MONGODB_PASSWORD
      - ME_CONFIG_MONGODB_SERVER=$MONGODB_HOST
      - ME_CONFIG_MONGODB_PORT=$MONGODB_DOCKER_PORT
    depends_on:
      - mongodb

  app:
    image: simple-accounting-node
    depends_on:
      - mongodb
    restart: unless-stopped
    env_file: ./.env
    ports:
      - $NODE_LOCAL_PORT:$NODE_DOCKER_PORT
    environment:
      - DB_HOST=$MONGODB_HOST
      - DB_USER=$MONGODB_USER
      - DB_PASSWORD=$MONGODB_PASSWORD
      - DB_NAME=$MONGODB_DATABASE
      - DB_PORT=$MONGODB_DOCKER_PORT
    stdin_open: true
    tty: true


volumes:
  db:
```