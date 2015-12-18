FROM andyet/node:5

WORKDIR /app
ADD . /app
RUN npm install

CMD ["npm", "start"]
