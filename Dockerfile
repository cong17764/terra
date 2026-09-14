FROM ubuntu

RUN apt update
RUN apt install -y nodejs npm

COPY --link package.json main.js /code/

WORKDIR /code
RUN npm install
RUN npm run certs

ENTRYPOINT ["npm", "start"]
