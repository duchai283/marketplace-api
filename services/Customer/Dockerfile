FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Copy source files
COPY . ./

RUN npm install

EXPOSE 3000

# Start server
CMD [ "npm","run","start" ]
