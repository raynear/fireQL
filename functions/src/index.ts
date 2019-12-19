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
  type Mutation {
    setHotdog(isKosher:Boolean, location:String, name:String, style:String, website:String):Hotdog
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
  },
  Mutation: {
    setHotdog: (parent: any, args: any) => {
      const db = admin.database();
      const ref = db.ref("hotdogs");
      const test = ref.push({ isKosher: args.isKosher, location: args.location, name: args.name, style: args.style, website: args.website });
      console.log(test);
      return args;
    }
  },
};

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
export const graphql = functions.https.onRequest(app);

