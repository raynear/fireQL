import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import * as express from "express";
import { ApolloServer, gql } from "apollo-server-express";

admin.initializeApp();

const typeDefs = gql`
  type Hotdog {
    isKosher: Boolean
    location: String
    name: String
    style: String
    website: String
  }
  type Query {
    hotdogs: [Hotdog]
  }
`;

const resolvers = {
  Query: {
    hotdogs: () =>
      admin
        .database()
        .ref("hotdogs")
        .once("value")
        .then(snap => snap.val())
        .then(val => Object.keys(val).map(key => val[key]))
  }
};

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
export const graphql = functions.https.onRequest(app);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
