FROM node:alpine

WORKDIR /usr/src/app

VOLUME [ "/usr/src/app" ]

RUN npm install -g nodemon
CMD [ "nodemon", "-L", "src/app.js" ]