FROM node:12

# Create app directory
WORKDIR /usr/src/app

COPY . .
# Install app dependencies
RUN npm install

EXPOSE 3000
# Start server
CMD [ "npm", "run", "start" ]
