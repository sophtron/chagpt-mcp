FROM node:23

WORKDIR /app

COPY ./src /app/src
COPY ./package.json /app/package.json
COPY ./nodemon.json /app/nodemon.json
COPY ./package-lock.json /app/package-lock.json

RUN npm ci --ignore-scripts --omit-dev
RUN npm install -g nodemon

ENV Env prod

EXPOSE 8080

ENTRYPOINT ["nodemon"]