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
    id: String
    name: String
    floor: Int
    equipment: [Equipment]
    photos: [String]
  }
  type Building {
    id: String
    name: String
    address: String
    rooms: [Room]
    fireManager: Worker
    manager: Worker
  }
  type Mutation {
    addBuilding(name:String, address:String):Building
    addRoom(buildingId:String, name:String, floor:Int):Room
  }
  type Query {
    buildings: [Building]
    buildingByName(name:String): Building
    building(id:String): Building
    rooms(buildingId:String): [Room]
    room(buildingId:String, roomId:String): Room
  }
`;

const resolvers = {
  Query: {
    async buildings(parent, args, context, info) {
      const Ref = admin.database().ref("buildings");
      const snap = await Ref.once("value");
      const value = snap.val();
      const RetObject = [];
      snap.forEach((childSnap) => {
        const aVal = childSnap.val();
        aVal['id'] = childSnap.key;
        RetObject.push(aVal);
      });
      // const test = Object.keys(value).map(key => value[key]);
      console.log(RetObject);
      return RetObject;
    },
    async buildingByName(parent, args, context, info) {
      const Ref = admin.database().ref("buildings");
      const snap = await Ref.orderByChild('name').equalTo(args.name).once("value");
      let aVal;
      snap.forEach((childSnap) => {
        aVal = childSnap.val();
        aVal['id'] = childSnap.key;
      })
      return aVal;
    },
    async rooms(parent, args, context, info) {
      const Ref = admin.database().ref("buildings/" + args.buildingId);
      // const childRef = await Ref.child("rooms");
      // const childSnap = await childRef.once("value");
      // const childValue = childSnap.val();
      // childSnap.forEach((aSnap) => {
      //   console.log("aSnap", aSnap.val());
      // });
      //      const val = await (await childRef.once("value")).val();
      //      val.forEach((childSnap) => {
      //        console.log("ASDFASDFSDF", childSnap);
      //      });
      const snap = await Ref.once("value");
      console.log("snap", snap.key, snap.val());
      const value = snap.val();
      const RetObject = [];
      snap.forEach((aSnap) => {
        const aVal = aSnap.val();
        console.log("aVal", aVal);
        if (aVal.name) {
          aVal['id'] = aSnap.key;
          RetObject.push(aVal);
        }
      });
      console.log(RetObject);
      // get room
      return RetObject;
    },
    async room(parent, args, context, info) {
      const Ref = admin.database().ref("buildings/" + args.buildingId + "/" + args.roomId);
      const snap = await Ref.once("value");
      console.log("snap", snap.key, snap.val());
      const value = snap.val();
      console.log("value", value);
      value['id'] = snap.key;
      return value;
    }
  },
  Mutation: {
    async addBuilding(parent, args, context, info) {
      const ref = admin.database().ref("buildings");
      const newRef = ref.push({ name: args.name, address: args.address });
      console.log("newRef", newRef);
      const ret = args['id'] = newRef;
      console.log("ret", ret);
      return ret;
    },
    async addRoom(parent, args, context, info) {
      const Ref = admin.database().ref("buildings/" + args.buildingId);
      const newRef = Ref.push({ name: args.name, floor: args.floor });
      const nr = (await newRef).toString().split("/");
      console.log("newRef", nr[nr.length - 1]);
      const ret = args;
      ret['id'] = nr[nr.length - 1];
      console.log("ret", ret);
      return ret;
    }
  },
};

const app = express()
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
export const graphql = functions.https.onRequest(app);

