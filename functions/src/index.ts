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
    editBuilding(buildingId:String!, name:String, address:String):Building
    delBuilding(buildingId:String!):Building
    addRoom(buildingId:String!, name:String, floor:Int):Room
    editRoom(buildingId:String!, roomId:String!, name:String, floor:Int):Room
    delRoom(buildingId:String!, roomId:String!):Room
  }
  type Query {
    buildingsByName(name:String): [Building]
    building(buildingId:String): Building
    buildings: [Building]
    rooms(buildingId:String): [Room]
    room(buildingId:String, roomId:String): Room
  }
`;

const building = async (parent, args, context, info) => {
  const doc = await admin.firestore().collection("buildings").doc(args.buildingId);
  const snap = await doc.get();
  if (snap.exists) {
    const data = snap.data();
    data['id'] = snap.id;
    data['rooms'] = await rooms(parent, args, context, info);
    return data;
  }
  return;
}

const buildings = async (parent, args, context, info) => {
  const coll = admin.firestore().collection("buildings");
  const snap = await coll.get();
  const ret = [];
  for (let i = 0; i < snap.size; i++) {
    const aBuilding = building(false, { buildingId: snap.docs[i].id }, false, false);
    ret.push(aBuilding);
  }
  return ret;
}

const buildingsByName = async (parent, args, context, info) => {
  const coll = admin.firestore().collection("buildings");
  const snap = await coll.where("name", "==", args.name).get();
  const ret = [];
  for (let i = 0; i < snap.size; i++) {
    const aDoc = snap.docs[i].data();
    aDoc['id'] = snap.docs[i].id;
    ret.push(aDoc);
  }
  return ret;
}

const room = async (parent, args, context, info) => {
  const doc = admin.firestore().collection("buildings").doc(args.buildingId).collection('rooms').doc(args.roomId);
  const snap = await doc.get();

  if (snap.exists) {
    const data = snap.data();
    data['id'] = snap.id;
    return data;
  }
  return;
}

const rooms = async (parent, args, context, info) => {
  const coll = admin.firestore().collection("buildings").doc(args.buildingId).collection('rooms');
  const roomsSnap = await coll.get();

  const ret = [];
  for (let i = 0; i < roomsSnap.size; i++) {
    const aDoc = roomsSnap.docs[i].data();
    aDoc['id'] = roomsSnap.docs[i].id;
    ret.push(aDoc);
  }
  return ret;
}


const addBuilding = async (parent, args, context, info) => {
  const coll = admin.firestore().collection("buildings");
  const doc = coll.doc();
  await doc.set({ name: args.name, address: args.address });
  const snap = await doc.get();
  if (snap.exists) {
    const data = snap.data();
    data['id'] = snap.id;
    return data;
  }
  return;
}

const editBuilding = async (parent, args, context, info) => {
  const data = { name: args.name, address: args.address };

  const doc = await admin.firestore().collection("buildings").doc(args.buildingId);
  const updateSingle = doc.update(data);
  console.log("updateSingle", updateSingle);
  const snap = await doc.get();
  if (snap.exists) {
    const ret = snap.data();
    ret['id'] = snap.id;
    return ret;
  }
  return;
}

const delBuilding = async (parent, args, context, info) => {
  const delDoc = await admin.firestore().collection("buildings").doc(args.buildingId).delete();
  console.log(delDoc);
  return delDoc;
}

const addRoom = async (parent, args, context, info) => {
  const coll = await admin.firestore().collection("buildings").doc(args.buildingId).collection('rooms');
  const doc = await coll.add({ name: args.name, floor: args.floor });
  console.log("doc", doc);
  const snap = await doc.get();
  console.log("snap", snap);
  if (snap.exists) {
    const data = snap.data();
    data['id'] = snap.id;
    console.log("data", data);
    return data;
  }
  return;
}

const editRoom = async (parent, args, context, info) => {
  const data = { name: args.name, floor: args.floor };

  const doc = await admin.firestore().collection("buildings").doc(args.buildingId).collection('rooms').doc(args.roomId);
  const updateSingle = doc.update(data);
  console.log("updateSingle", updateSingle);
  const snap = await doc.get();
  if (snap.exists) {
    const ret = snap.data();
    ret['id'] = snap.id;
    return ret;
  }
  return;
}

const delRoom = async (parent, args, context, info) => {
  const delDoc = await admin.firestore().collection("buildings").doc(args.buildingId).collection('rooms').doc(args.roomId).delete();
  console.log(delDoc);
  return delDoc;
}

const resolvers = {
  Query: {
    building, buildings, buildingsByName,
    room, rooms
  },
  Mutation: {
    addBuilding, editBuilding, delBuilding,
    addRoom, editRoom, delRoom
  }
};

const app = express()
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
export const graphql = functions.https.onRequest(app);

