import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import express from "express";
import { ApolloServer, gql } from "apollo-server-express";

const serviceAccount = require("../house-rental-8c426-firebase-adminsdk-q3as5-b21b515bbd.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://house-rental-8c426.firebaseio.com"
});

const typeDefs = gql`
  type Hotdog {
    isKosher: Boolean
    location: String
    name: String
    style: String
    website: String
  }
  enum RentType {
    DAY
    MONTH
    YEAR
    JEONSE
  }
  type Contract {
    photo:String
    type: RentType
    price: Int
    startDate: String
    endDate: String
  }
  type Worker {
    name: String
    phone: String
  }
  type Owner {
    name: String
  }
  type Renter {
    name: String
    phone: String
    contract:Contract
  }
  type Equipment {
    name: String
    kind: String
    buy_date: String
    as_phone: String
    photo: String
  }
  type Room {
    name: String
    floor: Int
    equipment: [Equipment]
    photos: [String]
  }
  type Building {
    name: String
    address: String
    rooms: [Room]
    fireManager: Worker
    manager: Worker
  }
  type Mutation {
    setHotdog(isKosher:Boolean, location:String, name:String, style:String, website:String):Hotdog
    addBuilding(name:String, address:String):Building
    addRoom(name:String, floor:Int, building:String):Room
  }
  type Query {
    hotdogs: [Hotdog]
    buildings: [Building]
    building(name:String): Building
    rooms: [Room]
  }
`;

const resolvers = {
  Query: {
    hotdogs: () => {
      return admin
        .database()
        .ref("hotdogs")
        .once("value")
        .then(snap => snap.val())
        .then(val => Object.keys(val).map(key => val[key]));
    },
    buildings: () => {
      return admin
        .database()
        .ref("buildings")
        .once("value")
        .then(snap => snap.val())
        .then(val => Object.keys(val).map(key => val[key]));
    },
    building(parent, args, context, info) {
      console.log("parent", parent);
      console.log("context", context);
      console.log("info", info);
      const Ref = admin.database().ref("buildings");
      Ref.orderByChild('name').equalTo(args.name).on('child_added', function (snap) {
        const value = snap.val();
        console.log("snap", value);
        const c = Object.keys(value).map(key => value[key]);
        console.log(c);
        return c;
      });
    }
  },
  Mutation: {
    setHotdog: (parent: any, args: any) => {
      const db = admin.database();
      const ref = db.ref("hotdogs");
      const test = ref.push({ isKosher: args.isKosher, location: args.location, name: args.name, style: args.style, website: args.website });
      console.log(test);
      return args;
    },
    addBuilding: (parent: any, args: any) => {
      const db = admin.database();
      const ref = db.ref("buildings");
      const test = ref.push({ name: args.name, address: args.address });
      console.log(test);
      return args;
    }
  },
};

const app = express()
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
export const graphql = functions.https.onRequest(app);

