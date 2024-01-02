FROM node:alpine

WORKDIR /usr/src/app

VOLUME [ "/usr/src/app" ]

COPY ./app ./app
COPY package*.json .

RUN npm install

RUN npm install -g nodemon
CMD [ "nodemon", "-L", "app/index.js" ]