FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm i -g @vercel/ncc

RUN ncc build src/app.js -o dist

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]