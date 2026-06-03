import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/on_fitness";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCached: MongooseCache;
  var useMockDatabase: boolean;
}

let cached = global.mongooseCached;

if (!cached) {
  cached = global.mongooseCached = { conn: null, promise: null };
}

// ----------------------------------------------------
// LOCAL JSON DATABASE MOCK IMPLEMENTATION
// ----------------------------------------------------

const dbFilePath = path.join(process.cwd(), "src", "data", "db.json");

function getMockData() {
  if (!fs.existsSync(dbFilePath)) {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const defaultData = {
      admins: [],
      members: [],
      payments: [],
      notifications: [],
      inquiries: [],
      exercises: [],
      gallery: [],
      attendance: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultData, null, 2), "utf8");
  }
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveMockData(data: any) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
}

function getCollectionName(modelName: string): string {
  const map: any = {
    Admin: "admins",
    Member: "members",
    Payment: "payments",
    Notification: "notifications",
    Inquiry: "inquiries",
    Exercise: "exercises",
    Gallery: "gallery",
    Attendance: "attendance"
  };
  return map[modelName] || modelName.toLowerCase() + "s";
}

function matchesQuery(item: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const key of Object.keys(filter)) {
    const filterVal = filter[key];

    if (key === "$or" && Array.isArray(filterVal)) {
      let matched = false;
      for (const subFilter of filterVal) {
        if (matchesQuery(item, subFilter)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
      continue;
    }

    if (key === "$and" && Array.isArray(filterVal)) {
      for (const subFilter of filterVal) {
        if (!matchesQuery(item, subFilter)) {
          return false;
        }
      }
      continue;
    }

    const itemVal = item[key];

    const isOperatorObj = filterVal && typeof filterVal === "object" && 
                          !Array.isArray(filterVal) && 
                          !(filterVal instanceof Date) &&
                          Object.keys(filterVal).some(k => k.startsWith("$"));

    if (isOperatorObj) {
      for (const op of Object.keys(filterVal)) {
        const opVal = filterVal[op];
        if (op === "$gte") {
          if (new Date(itemVal) < new Date(opVal)) return false;
        } else if (op === "$lte") {
          if (new Date(itemVal) > new Date(opVal)) return false;
        } else if (op === "$gt") {
          if (new Date(itemVal) <= new Date(opVal)) return false;
        } else if (op === "$lt") {
          if (new Date(itemVal) >= new Date(opVal)) return false;
        } else if (op === "$ne") {
          if (itemVal === opVal) return false;
        } else if (op === "$in" && Array.isArray(opVal)) {
          if (!opVal.includes(itemVal)) return false;
        }
      }
      continue;
    }

    const itemStr = itemVal ? itemVal.toString() : "";
    const filterStr = filterVal ? filterVal.toString() : "";
    if (itemStr !== filterStr) {
      if (key === "email" && itemStr.toLowerCase() === filterStr.toLowerCase()) {
        continue;
      }
      return false;
    }
  }

  return true;
}

function runMockFind(modelName: string, filter: any, options: { limit?: number | null, skip?: number | null, sort?: any } = {}) {
  const data = getMockData();
  const collectionName = getCollectionName(modelName);
  let collection = data[collectionName] || [];

  let results = collection.filter((item: any) => matchesQuery(item, filter));

  if (options.sort) {
    const sortKeys = Object.keys(options.sort);
    results.sort((a: any, b: any) => {
      for (const key of sortKeys) {
        const dir = options.sort[key] === -1 || options.sort[key] === "desc" ? -1 : 1;
        if (a[key] < b[key]) return -1 * dir;
        if (a[key] > b[key]) return 1 * dir;
      }
      return 0;
    });
  }

  if (options.skip) {
    results = results.slice(options.skip);
  }

  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results.map((item: any) => createMockDocument(modelName, item));
}

class MockQuery {
  private modelName: string;
  private filter: any;
  private _limit: number | null = null;
  private _skip: number | null = null;
  private _sort: any = null;
  private _single: boolean = false;

  constructor(modelName: string, filter: any, single: boolean = false) {
    this.modelName = modelName;
    this.filter = filter;
    this._single = single;
  }

  sort(sortOpts: any) {
    this._sort = sortOpts;
    return this;
  }

  limit(limitVal: number) {
    this._limit = limitVal;
    return this;
  }

  skip(skipVal: number) {
    this._skip = skipVal;
    return this;
  }

  populate(path: any) {
    return this;
  }

  select(projection: any) {
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    if (this._single) {
      const results = runMockFind(this.modelName, this.filter, {
        limit: 1,
        sort: this._sort,
      });
      return results.length > 0 ? results[0] : null;
    } else {
      return runMockFind(this.modelName, this.filter, {
        limit: this._limit,
        skip: this._skip,
        sort: this._sort,
      });
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch(onrejected?: (reason: any) => any) {
    return this.exec().catch(onrejected);
  }

  finally(onfinally?: () => void) {
    return this.exec().finally(onfinally);
  }
}

function createMockDocument(modelName: string, rawDoc: any) {
  if (!rawDoc) return null;
  
  const doc = { ...rawDoc };
  
  if (doc._id) {
    const idStr = doc._id.toString();
    doc._id = {
      toString: () => idStr,
      toJSON: () => idStr,
      equals: (other: any) => other && other.toString() === idStr
    } as any;
  }

  doc.isModified = function(pathName: string) {
    if (pathName === "password") {
      return (doc.password || doc._password) && !(doc.password || "").startsWith("$2b$") && !(doc.password || "").startsWith("$2a$");
    }
    return false;
  };

  doc.save = async function() {
    const data = getMockData();
    const collectionName = getCollectionName(modelName);
    const collection = data[collectionName] || [];

    if (modelName === "Member") {
      // Map old fields to new fields for mock database
      if (doc.fullName && !doc.name) doc.name = doc.fullName;
      if (doc.name && !doc.fullName) doc.fullName = doc.name;
      if (doc.phoneNumber && !doc.phone) doc.phone = doc.phoneNumber;
      if (doc.phone && !doc.phoneNumber) doc.phoneNumber = doc.phone;
      if (doc.joinDate && !doc.membershipStartDate) doc.membershipStartDate = doc.joinDate;
      if (doc.membershipStartDate && !doc.joinDate) doc.joinDate = doc.membershipStartDate;
      if (doc.membershipExpiry && !doc.membershipEndDate) doc.membershipEndDate = doc.membershipExpiry;
      if (doc.membershipEndDate && !doc.membershipExpiry) doc.membershipExpiry = doc.membershipEndDate;

      if (doc.isModified("password")) {
        const plainPwd = doc._password || doc.password;
        const salt = await bcrypt.genSalt(10);
        doc.hashedPassword = await bcrypt.hash(plainPwd, salt);
        doc.password = doc.hashedPassword;
      }
      
      if (!doc.membershipEndDate || doc.membershipPlan || doc.membershipDuration) {
        const start = doc.membershipStartDate ? new Date(doc.membershipStartDate) : new Date();
        const duration = doc.membershipDuration || (doc.membershipPlan === "Quarterly" ? 3 : doc.membershipPlan === "Half-Yearly" ? 6 : doc.membershipPlan === "Annual" ? 12 : 1);
        doc.membershipDuration = duration;
        doc.membershipPlan = duration === 3 ? "Quarterly" : duration === 6 ? "Half-Yearly" : duration === 12 ? "Annual" : "Monthly";
        const end = new Date(start);
        end.setMonth(end.getMonth() + duration);
        doc.membershipEndDate = end.toISOString();
        doc.membershipExpiry = doc.membershipEndDate;
      }
      
      doc.remainingAmount = Math.max(0, (doc.totalFee || 0) - (doc.totalPaid || 0));
      
      // Calculate payment status
      if ((doc.totalPaid || 0) >= (doc.totalFee || 0)) {
        doc.paymentStatus = "Paid";
      } else if ((doc.totalPaid || 0) > 0) {
        doc.paymentStatus = "Partially Paid";
      } else {
        doc.paymentStatus = "Unpaid";
      }

      if (doc.membershipStatus !== "Suspended" && doc.isActive !== false) {
        const diffDays = Math.ceil((new Date(doc.membershipEndDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          doc.membershipStatus = "Expired";
        } else if (diffDays <= 10) {
          doc.membershipStatus = "Expiring Soon";
        } else {
          doc.membershipStatus = "Active";
        }
      } else {
        doc.membershipStatus = "Suspended";
        doc.isActive = false;
      }
    } else if (modelName === "Admin") {
      if (doc.isModified("password")) {
        const plainPwd = doc._password || doc.password;
        const salt = await bcrypt.genSalt(10);
        doc.hashedPassword = await bcrypt.hash(plainPwd, salt);
        doc.password = doc.hashedPassword;
      }
    }

    doc.updatedAt = new Date().toISOString();
    
    const idStr = doc._id.toString();
    const idx = collection.findIndex((item: any) => item._id === idStr);
    
    const rawToSave = { ...doc };
    delete rawToSave.isModified;
    delete rawToSave.save;
    delete rawToSave.comparePassword;
    delete rawToSave.updateOne;
    delete rawToSave.deleteOne;
    rawToSave._id = idStr;

    if (idx >= 0) {
      collection[idx] = rawToSave;
    } else {
      rawToSave.createdAt = new Date().toISOString();
      collection.push(rawToSave);
    }

    data[collectionName] = collection;
    saveMockData(data);
    return doc;
  };

  doc.comparePassword = async function(password: string) {
    const hash = rawDoc.hashedPassword || rawDoc.password || "";
    if (hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
      return bcrypt.compare(password, hash);
    }
    return password === hash;
  };

  doc.updateOne = async function(updateObj: any) {
    const updates = updateObj.$set || updateObj;
    for (const key of Object.keys(updates)) {
      doc[key] = updates[key];
    }
    return doc.save();
  };

  doc.deleteOne = async function() {
    const data = getMockData();
    const collectionName = getCollectionName(modelName);
    const idStr = doc._id.toString();
    data[collectionName] = (data[collectionName] || []).filter((item: any) => item._id !== idStr);
    saveMockData(data);
    return { deletedCount: 1 };
  };

  return doc;
}

function wrapModel(modelName: string, modelClass: any) {
  const originalFind = modelClass.find;
  const originalFindOne = modelClass.findOne;
  const originalFindById = modelClass.findById;
  const originalCountDocuments = modelClass.countDocuments;
  const originalCreate = modelClass.create;
  const originalFindByIdAndDelete = modelClass.findByIdAndDelete;
  const originalFindByIdAndUpdate = modelClass.findByIdAndUpdate;
  const originalUpdateOne = modelClass.updateOne;
  const originalUpdateMany = modelClass.updateMany;
  const originalDeleteOne = modelClass.deleteOne;
  const originalDeleteMany = modelClass.deleteMany;

  const originalInsertMany = modelClass.insertMany;

  modelClass.find = function(query: any) {
    if (global.useMockDatabase) {
      return new MockQuery(modelName, query) as any;
    }
    return originalFind.apply(this, arguments as any);
  };

  modelClass.findOne = function(query: any) {
    if (global.useMockDatabase) {
      return new MockQuery(modelName, query, true) as any;
    }
    return originalFindOne.apply(this, arguments as any);
  };

  modelClass.findById = function(id: any) {
    if (global.useMockDatabase) {
      return new MockQuery(modelName, { _id: id }, true) as any;
    }
    return originalFindById.apply(this, arguments as any);
  };

  modelClass.countDocuments = function(query: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, query);
      return Promise.resolve(results.length) as any;
    }
    return originalCountDocuments.apply(this, arguments as any);
  };

  modelClass.create = function(doc: any) {
    if (global.useMockDatabase) {
      if (Array.isArray(doc)) {
        const promises = doc.map((d: any) => {
          const rawDoc = { _id: new mongoose.Types.ObjectId().toString(), ...d };
          const mockDoc: any = createMockDocument(modelName, rawDoc);
          return mockDoc.save();
        });
        return Promise.all(promises) as any;
      }
      const rawDoc = { _id: new mongoose.Types.ObjectId().toString(), ...doc };
      const mockDoc: any = createMockDocument(modelName, rawDoc);
      return mockDoc.save() as any;
    }
    return originalCreate.apply(this, arguments as any);
  };

  modelClass.insertMany = function(docs: any) {
    if (global.useMockDatabase) {
      const arr = Array.isArray(docs) ? docs : [docs];
      const promises = arr.map((d: any) => {
        const rawDoc = { _id: new mongoose.Types.ObjectId().toString(), ...d };
        const mockDoc: any = createMockDocument(modelName, rawDoc);
        return mockDoc.save();
      });
      return Promise.all(promises) as any;
    }
    return originalInsertMany.apply(this, arguments as any);
  };

  modelClass.findByIdAndDelete = function(id: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, { _id: id }, { limit: 1 });
      if (results.length > 0) {
        return results[0].deleteOne();
      }
      return Promise.resolve(null) as any;
    }
    return originalFindByIdAndDelete.apply(this, arguments as any);
  };

  modelClass.findByIdAndUpdate = function(id: any, update: any, options: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, { _id: id }, { limit: 1 });
      if (results.length > 0) {
        const doc = results[0];
        const updates = update.$set || update;
        for (const key of Object.keys(updates)) {
          doc[key] = updates[key];
        }
        return doc.save() as any;
      }
      return Promise.resolve(null) as any;
    }
    return originalFindByIdAndUpdate.apply(this, arguments as any);
  };

  modelClass.updateOne = function(query: any, update: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, query, { limit: 1 });
      if (results.length > 0) {
        const doc = results[0];
        const updates = update.$set || update;
        for (const key of Object.keys(updates)) {
          doc[key] = updates[key];
        }
        return doc.save().then(() => ({ modifiedCount: 1 })) as any;
      }
      return Promise.resolve({ modifiedCount: 0 }) as any;
    }
    return originalUpdateOne.apply(this, arguments as any);
  };

  modelClass.updateMany = function(query: any, update: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, query);
      const promises = results.map((doc: any) => {
        const updates = update.$set || update;
        for (const key of Object.keys(updates)) {
          doc[key] = updates[key];
        }
        return doc.save();
      });
      return Promise.all(promises).then((res) => ({ modifiedCount: res.length })) as any;
    }
    return originalUpdateMany.apply(this, arguments as any);
  };

  modelClass.deleteOne = function(query: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, query, { limit: 1 });
      if (results.length > 0) {
        return results[0].deleteOne() as any;
      }
      return Promise.resolve({ deletedCount: 0 }) as any;
    }
    return originalDeleteOne.apply(this, arguments as any);
  };

  modelClass.deleteMany = function(query: any) {
    if (global.useMockDatabase) {
      const results = runMockFind(modelName, query);
      const promises = results.map((doc: any) => doc.deleteOne());
      return Promise.all(promises).then((res) => ({ deletedCount: res.length })) as any;
    }
    return originalDeleteMany.apply(this, arguments as any);
  };
}

function initMockDatabase() {
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    wrapModel(modelName, model);
  }

  const data = getMockData();
  let dataChanged = false;

  if (!data.admins) {
    data.admins = [];
  }
  
  // Filter out legacy admin
  data.admins = data.admins.filter((a: any) => a.email !== "admin@gym.com" && a.phone);

  const hasVanshika = data.admins.some((a: any) => a.phone === "9588715527");
  const hasSukchain = data.admins.some((a: any) => a.phone === "8400050073");
  const hasAkash = data.admins.some((a: any) => a.uniqueId === "akash1284");

  if (!hasVanshika) {
    data.admins.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Vanshika",
      uniqueId: "vanshika16",
      phone: "9588715527",
      email: "vanshikapahal16@gmail.com",
      password: "Vanshika@123",
      hashedPassword: "", // will be hashed below
      role: "superadmin",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    dataChanged = true;
  } else {
    const idx = data.admins.findIndex((a: any) => a.phone === "9588715527");
    if (idx >= 0 && !data.admins[idx].uniqueId) {
      data.admins[idx].uniqueId = "vanshika16";
      dataChanged = true;
    }
  }

  if (!hasSukchain) {
    data.admins.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Sukchain",
      uniqueId: "sukchain",
      phone: "8400050073",
      email: "sukchain@gmail.com",
      password: "Sukchain@123",
      hashedPassword: "", // will be hashed below
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    dataChanged = true;
  } else {
    const idx = data.admins.findIndex((a: any) => a.phone === "8400050073");
    if (idx >= 0 && !data.admins[idx].uniqueId) {
      data.admins[idx].uniqueId = "sukchain";
      dataChanged = true;
    }
  }

  if (!hasAkash) {
    data.admins.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Akash",
      uniqueId: "akash1284",
      phone: "0000000000",
      email: "akash@onfitness.com",
      password: "340515",
      hashedPassword: "", // will be hashed below
      role: "superadmin",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    dataChanged = true;
  }

  if (!data.members) {
    data.members = [];
  }

  const hasRahul = data.members.some((m: any) => m.phone === "9999999999" || m.phoneNumber === "9999999999");
  if (!hasRahul) {
    data.members.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Rahul",
      fullName: "Rahul",
      phone: "9999999999",
      phoneNumber: "9999999999",
      email: "rahul@gmail.com",
      address: "Delhi, India",
      password: "Rahul@123",
      hashedPassword: "", // will be hashed below
      membershipPlan: "Gold",
      membershipDuration: 12,
      membershipStartDate: new Date().toISOString(),
      membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      membershipExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      totalFee: 1000,
      totalPaid: 1000,
      remainingAmount: 0,
      membershipStatus: "Active",
      paymentStatus: "Paid",
      isActive: true,
      mustChangePassword: false,
      role: "member",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    dataChanged = true;
  }

  if (dataChanged) {
    (async () => {
      for (const admin of data.admins) {
        const pwd = admin.password || admin.hashedPassword;
        if (pwd && !pwd.startsWith("$2b$") && !pwd.startsWith("$2a$")) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(pwd, salt);
          admin.password = hashed;
          admin.hashedPassword = hashed;
        }
      }
      for (const member of data.members) {
        const pwd = member.password || member.hashedPassword;
        if (pwd && !pwd.startsWith("$2b$") && !pwd.startsWith("$2a$")) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(pwd, salt);
          member.password = hashed;
          member.hashedPassword = hashed;
        }
      }
      saveMockData(data);
      console.log("🌱 Local JSON database successfully seeded!");
    })();
  }
}

const originalModel = mongoose.model;
(mongoose as any).model = function (name: string, schema: any, collection: any) {
  const model = originalModel.apply(this, arguments as any);
  if (global.useMockDatabase) {
    wrapModel(name, model);
  }
  return model;
};

// Seed Real MongoDB Database
async function seedDatabaseIfEmpty() {
  try {
    const Admin = mongoose.models.Admin || require("@/models/Admin").default || require("@/models/Admin");
    const Member = mongoose.models.Member || require("@/models/Member").default || require("@/models/Member");

    console.log("🌱 Verifying / Seeding real database records...");

    // Drop legacy unique index if it exists on admins collection
    try {
      await Admin.collection.dropIndex("adminId_1");
      console.log("🗑️ Successfully dropped legacy unique index: adminId_1");
    } catch (e) {
      // Index doesn't exist, ignore
    }

    // Clean up any corrupted/incomplete documents from older migrations
    await Admin.deleteMany({
      $or: [
        { phone: { $exists: false } },
        { name: { $exists: false } },
        { phone: "" },
        { name: "" }
      ]
    });

    await Member.deleteMany({
      $or: [
        { phone: { $exists: false } },
        { name: { $exists: false } },
        { phone: "" },
        { name: "" }
      ]
    });

    // 1. Seed Vanshika
    const existingVanshika = await Admin.findOne({
      $or: [{ phone: "9588715527" }, { email: "vanshikapahal16@gmail.com" }]
    });
    if (!existingVanshika) {
      console.log("🌱 Creating admin: Vanshika");
      await Admin.create({
        name: "Vanshika",
        uniqueId: "vanshika16",
        phone: "9588715527",
        email: "vanshikapahal16@gmail.com",
        password: "Vanshika@123",
        role: "superadmin",
        isActive: true,
      });
    } else {
      console.log("🌱 Admin Vanshika already exists. Updating credentials/role...");
      existingVanshika.name = "Vanshika";
      existingVanshika.uniqueId = "vanshika16";
      existingVanshika.phone = "9588715527";
      existingVanshika.email = "vanshikapahal16@gmail.com";
      existingVanshika.role = "superadmin";
      existingVanshika.isActive = true;
      existingVanshika.password = "Vanshika@123";
      await existingVanshika.save();
    }

    // 2. Seed Sukchain
    const existingSukchain = await Admin.findOne({
      $or: [{ phone: "8400050073" }, { email: "sukchain@gmail.com" }]
    });
    if (!existingSukchain) {
      console.log("🌱 Creating admin: Sukchain");
      await Admin.create({
        name: "Sukchain",
        uniqueId: "sukchain",
        phone: "8400050073",
        email: "sukchain@gmail.com",
        password: "Sukchain@123",
        role: "admin",
        isActive: true,
      });
    } else {
      console.log("🌱 Admin Sukchain already exists. Updating credentials/role...");
      existingSukchain.name = "Sukchain";
      existingSukchain.uniqueId = "sukchain";
      existingSukchain.phone = "8400050073";
      existingSukchain.email = "sukchain@gmail.com";
      existingSukchain.role = "admin";
      existingSukchain.isActive = true;
      existingSukchain.password = "Sukchain@123";
      await existingSukchain.save();
    }

    // 2.5 Seed Akash
    const existingAkash = await Admin.findOne({ uniqueId: "akash1284" });
    if (!existingAkash) {
      console.log("🌱 Creating admin: Akash");
      await Admin.create({
        name: "Akash",
        uniqueId: "akash1284",
        phone: "0000000000",
        email: "akash@onfitness.com",
        password: "340515",
        role: "superadmin",
        isActive: true,
      });
    } else {
      console.log("🌱 Admin Akash already exists. Updating credentials/role...");
      existingAkash.name = "Akash";
      existingAkash.uniqueId = "akash1284";
      existingAkash.phone = "0000000000";
      existingAkash.email = "akash@onfitness.com";
      existingAkash.role = "superadmin";
      existingAkash.isActive = true;
      existingAkash.password = "340515";
      await existingAkash.save();
    }

    // 3. Seed Rahul
    const existingRahul = await Member.findOne({
      $or: [{ phone: "9999999999" }, { email: "rahul@gmail.com" }]
    });
    if (!existingRahul) {
      console.log("🌱 Creating member: Rahul");
      await Member.create({
        name: "Rahul",
        phone: "9999999999",
        email: "rahul@gmail.com",
        address: "Delhi, India",
        password: "Rahul@123",
        membershipPlan: "Gold",
        membershipDuration: 12,
        totalFee: 1000,
        totalPaid: 1000,
        mustChangePassword: false,
        isActive: true,
        role: "member",
      });
    } else {
      console.log("🌱 Member Rahul already exists. Updating credentials/plan...");
      existingRahul.name = "Rahul";
      existingRahul.phone = "9999999999";
      existingRahul.email = "rahul@gmail.com";
      existingRahul.address = "Delhi, India";
      existingRahul.membershipPlan = "Gold";
      existingRahul.membershipDuration = 12;
      existingRahul.totalFee = 1000;
      existingRahul.totalPaid = 1000;
      existingRahul.mustChangePassword = false;
      existingRahul.isActive = true;
      existingRahul.password = "Rahul@123";
      await existingRahul.save();
    }

    // 4. Seed Gym Member
    const existingGymMember = await Member.findOne({
      $or: [{ phone: "9876543210" }, { email: "member@gym.com" }]
    });
    if (!existingGymMember) {
      console.log("🌱 Creating member: Gym Member");
      await Member.create({
        name: "Gym Member",
        phone: "9876543210",
        email: "member@gym.com",
        address: "123 Fitness Street",
        password: "Member@123",
        membershipPlan: "Annual",
        membershipDuration: 12,
        totalFee: 500,
        totalPaid: 500,
        mustChangePassword: false,
        isActive: true,
        role: "member",
      });
    } else {
      console.log("🌱 Member Gym Member already exists. Updating credentials/plan...");
      existingGymMember.name = "Gym Member";
      existingGymMember.phone = "9876543210";
      existingGymMember.email = "member@gym.com";
      existingGymMember.address = "123 Fitness Street";
      existingGymMember.membershipPlan = "Annual";
      existingGymMember.membershipDuration = 12;
      existingGymMember.totalFee = 500;
      existingGymMember.totalPaid = 500;
      existingGymMember.mustChangePassword = false;
      existingGymMember.isActive = true;
      existingGymMember.password = "Member@123";
      await existingGymMember.save();
    }

    console.log("🌱 Idempotent seeding completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed real database:", error);
  }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("🔋 Connected successfully to MongoDB Atlas database.");
    await seedDatabaseIfEmpty();
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    console.warn("❌ MongoDB connection failed. Activating local JSON database fallback.");
    console.warn("Reason:", e.message);
    global.useMockDatabase = true;
    initMockDatabase();
  }

  return cached.conn;
}
