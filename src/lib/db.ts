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
  var databaseConnectionError: string | null;
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
      attendance: [],
      qrcode_tokens: [],
      attendance_logs: []
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
    Attendance: "attendance",
    QRCodeTokens: "qrcode_tokens",
    AttendanceLogs: "attendance_logs"
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

    // Support regex check for RegExp instances
    if (filterVal instanceof RegExp) {
      if (!filterVal.test(itemVal ? itemVal.toString() : "")) {
        return false;
      }
      continue;
    }

    // Support regex check for $regex operator objects
    if (filterVal && typeof filterVal === "object" && "$regex" in filterVal) {
      const regexStr = filterVal.$regex;
      const options = filterVal.$options || "";
      try {
        const regex = new RegExp(regexStr, options);
        if (!regex.test(itemVal ? itemVal.toString() : "")) {
          return false;
        }
      } catch (e) {
        return false;
      }
      continue;
    }

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
  const collection = data[collectionName] || [];

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
  private _populates: { path: string; select?: string }[] = [];

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

  populate(path: any, select?: any) {
    if (typeof path === "string") {
      this._populates.push({ path, select });
    } else if (path && typeof path === "object" && path.path) {
      this._populates.push({ path: path.path, select: path.select });
    }
    return this;
  }

  select(projection: any) {
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    let docs: any;
    if (this._single) {
      const results = runMockFind(this.modelName, this.filter, {
        limit: 1,
        sort: this._sort,
      });
      docs = results.length > 0 ? results[0] : null;
    } else {
      docs = runMockFind(this.modelName, this.filter, {
        limit: this._limit,
        skip: this._skip,
        sort: this._sort,
      });
    }

    if (docs && this._populates.length > 0) {
      const isArray = Array.isArray(docs);
      const docList = isArray ? docs : [docs];
      const model = (mongoose as any).models[this.modelName];

      for (const pop of this._populates) {
        const pathField = pop.path;
        const selectFields = typeof pop.select === "string" ? pop.select.split(/\s+/) : null;

        const schemaPath = model?.schema?.paths[pathField];
        const refModelName = schemaPath?.options?.ref;

        if (refModelName) {
          for (const doc of docList) {
            const refId = doc[pathField];
            if (refId) {
              const refIdStr = refId.toString();
              const refDocs = runMockFind(refModelName, { _id: refIdStr });
              if (refDocs.length > 0) {
                const fullRefDoc = refDocs[0];
                let populatedObj: any = {};

                if (selectFields) {
                  selectFields.forEach((f: string) => {
                    if (f) {
                      populatedObj[f] = fullRefDoc[f];
                    }
                  });
                  populatedObj._id = fullRefDoc._id;
                  populatedObj.id = fullRefDoc.id || fullRefDoc._id?.toString();
                } else {
                  populatedObj = { ...fullRefDoc };
                }

                doc[pathField] = populatedObj;
              }
            }
          }
        }
      }
    }

    return docs;
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

  if (modelName === "Member") {
    if (doc.approved === undefined) doc.approved = false;
    if (doc.membershipActive === undefined) doc.membershipActive = false;
    if (doc.role === undefined) doc.role = "member";
    if (doc.isActive === undefined) doc.isActive = true;
    if (doc.attendanceCount === undefined) doc.attendanceCount = 0;
    if (doc.mustChangePassword === undefined) doc.mustChangePassword = true;
    if (!doc.qrIdentifier) {
      doc.qrIdentifier = "qr_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      doc.qrCreatedAt = new Date().toISOString();
    }
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

  doc.toObject = function() {
    const obj = { ...doc };
    delete obj.isModified;
    delete obj.save;
    delete obj.comparePassword;
    delete obj.updateOne;
    delete obj.deleteOne;
    delete obj.toObject;
    return obj;
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

  if (!data.exercises) {
    data.exercises = [];
  }
  if (data.exercises.length === 0) {
    const DEFAULT_EXERCISES = [
      { title: "Bench Press", category: "Chest", type: "Strength", level: "Intermediate", target: "Pectoralis Major", reps: "4 sets x 8-12 reps", duration: "10 mins", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470" },
      { title: "Deadlift", category: "Back", type: "Strength", level: "Advanced", target: "Lower Back, Glutes", reps: "3 sets x 5-8 reps", duration: "15 mins", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470" },
      { title: "Squats", category: "Legs", type: "Strength", level: "Beginner", target: "Quadriceps, Glutes", reps: "4 sets x 10-15 reps", duration: "12 mins", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470" },
      { title: "HIIT Sprint", category: "Cardio", type: "Fat Burn", level: "Intermediate", target: "Full Body", reps: "10 rounds x 30s", duration: "20 mins", img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1470" },
      { title: "Overhead Press", category: "Shoulder", type: "Muscle Gain", level: "Intermediate", target: "Deltoids", reps: "3 sets x 10-12 reps", duration: "10 mins", img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469" },
      { title: "Push Ups", category: "Beginner", type: "Endurance", level: "Beginner", target: "Chest, Triceps", reps: "3 sets to failure", duration: "5 mins", img: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1446" },
    ];
    data.exercises = DEFAULT_EXERCISES.map(e => ({
      _id: new mongoose.Types.ObjectId().toString(),
      ...e,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    dataChanged = true;
  }

  if (!data.admins) {
    data.admins = [];
  }
  
  // Filter out legacy admin
  data.admins = data.admins.filter((a: any) => a.email !== "admin@gym.com" && a.phone);

  const hasVanshika = data.admins.some((a: any) => a.phone === "9588715527");
  const hasSukchain = data.admins.some((a: any) => a.phone === "8400050073");
  const hasAkash = data.admins.some((a: any) => a.uniqueId === "akash1284");

  const adminPasswordVanshika = process.env.INITIAL_ADMIN_PASSWORD || "Vanshika@123";
  const adminPasswordSukchain = process.env.INITIAL_ADMIN_PASSWORD || "Sukchain@123";
  const adminPasswordAkash = process.env.INITIAL_ADMIN_PASSWORD || "340515";

  if (!hasVanshika) {
    data.admins.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: "Vanshika",
      uniqueId: "vanshika16",
      phone: "9588715527",
      email: "vanshikapahal16@gmail.com",
      password: adminPasswordVanshika,
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
      password: adminPasswordSukchain,
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
      password: adminPasswordAkash,
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

  // Remove any legacy mock members from the JSON database
  const originalLength = data.members.length;
  data.members = data.members.filter(
    (m: any) =>
      m.phone !== "9999999999" &&
      m.phoneNumber !== "9999999999" &&
      m.phone !== "9876543210" &&
      m.phoneNumber !== "9876543210" &&
      m.email !== "rahul@gmail.com" &&
      m.email !== "member@gym.com"
  );
  if (data.members.length !== originalLength) {
    dataChanged = true;
  }

  // Migrate existing members without QR identifiers
  for (const m of data.members) {
    if (!m.qrIdentifier) {
      m.qrIdentifier = "qr_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      m.qrCreatedAt = new Date().toISOString();
      dataChanged = true;
    }
  }

  // Remove orphaned payments and attendance from the JSON database
  if (!data.payments) {
    data.payments = [];
  }
  const memberIds = new Set(data.members.map((m: any) => m._id.toString()));
  const origPaymentsLength = data.payments.length;
  data.payments = data.payments.filter((p: any) => p.memberId && memberIds.has(p.memberId.toString()));
  if (data.payments.length !== origPaymentsLength) {
    dataChanged = true;
  }

  if (!data.attendance) {
    data.attendance = [];
  }
  const origAttendanceLength = data.attendance.length;
  data.attendance = data.attendance.filter((a: any) => a.memberId && memberIds.has(a.memberId.toString()));
  if (data.attendance.length !== origAttendanceLength) {
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
    const AdminModule = await import("../models/Admin");
    const Admin = mongoose.models.Admin || AdminModule.default || AdminModule;
    const MemberModule = await import("../models/Member");
    const Member = mongoose.models.Member || MemberModule.default || MemberModule;

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

    const adminPasswordVanshika = process.env.INITIAL_ADMIN_PASSWORD || "Vanshika@123";
    const adminPasswordSukchain = process.env.INITIAL_ADMIN_PASSWORD || "Sukchain@123";
    const adminPasswordAkash = process.env.INITIAL_ADMIN_PASSWORD || "340515";

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
        password: adminPasswordVanshika,
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
      existingVanshika.password = adminPasswordVanshika;
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
        password: adminPasswordSukchain,
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
      existingSukchain.password = adminPasswordSukchain;
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
        password: adminPasswordAkash,
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
      existingAkash.password = adminPasswordAkash;
      await existingAkash.save();
    }

    // Automatically clean up legacy mock members and their payments from the real database
    const deletedMembers = await Member.find({
      $or: [
        { phone: "9999999999" },
        { phoneNumber: "9999999999" },
        { phone: "9876543210" },
        { phoneNumber: "9876543210" },
        { email: "rahul@gmail.com" },
        { email: "member@gym.com" }
      ]
    });
    if (deletedMembers.length > 0) {
      console.log(`🗑️ Deleting ${deletedMembers.length} legacy mock member(s) from real database...`);
      const deletedIds = deletedMembers.map(m => m._id);
      await Member.deleteMany({ _id: { $in: deletedIds } });
      const PaymentModule = await import("../models/Payment");
      const Payment = mongoose.models.Payment || PaymentModule.default || PaymentModule;
      await Payment.deleteMany({ memberId: { $in: deletedIds } });
    }

    // Clean up any remaining orphaned payment and attendance records from real database
    const PaymentModule = await import("../models/Payment");
    const Payment = mongoose.models.Payment || PaymentModule.default || PaymentModule;
    const allMembers = await Member.find({});
    const validIds = allMembers.map(m => m._id);
    const deletedPayments = await Payment.deleteMany({ memberId: { $nin: validIds } });
    if (deletedPayments.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedPayments.deletedCount} orphaned payment records from real database.`);
    }

    try {
      const AttendanceModule = await import("../models/Attendance");
      const Attendance = mongoose.models.Attendance || AttendanceModule.default || AttendanceModule;
      const deletedAttendance = await Attendance.deleteMany({ memberId: { $nin: validIds } });
      if (deletedAttendance.deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${deletedAttendance.deletedCount} orphaned attendance records from real database.`);
      }
    } catch (err) {}

    // 3. Seed Default Exercises
    try {
      const ExerciseModule = await import("../models/Exercise");
      const Exercise = mongoose.models.Exercise || ExerciseModule.default || ExerciseModule;
      const exerciseCount = await Exercise.countDocuments({});
      if (exerciseCount === 0) {
        console.log("🌱 Seeding default exercises into real database...");
        const DEFAULT_EXERCISES = [
          { title: "Bench Press", category: "Chest", type: "Strength", level: "Intermediate", target: "Pectoralis Major", reps: "4 sets x 8-12 reps", duration: "10 mins", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470" },
          { title: "Deadlift", category: "Back", type: "Strength", level: "Advanced", target: "Lower Back, Glutes", reps: "3 sets x 5-8 reps", duration: "15 mins", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470" },
          { title: "Squats", category: "Legs", type: "Strength", level: "Beginner", target: "Quadriceps, Glutes", reps: "4 sets x 10-15 reps", duration: "12 mins", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470" },
          { title: "HIIT Sprint", category: "Cardio", type: "Fat Burn", level: "Intermediate", target: "Full Body", reps: "10 rounds x 30s", duration: "20 mins", img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1470" },
          { title: "Overhead Press", category: "Shoulder", type: "Muscle Gain", level: "Intermediate", target: "Deltoids", reps: "3 sets x 10-12 reps", duration: "10 mins", img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469" },
          { title: "Push Ups", category: "Beginner", type: "Endurance", level: "Beginner", target: "Chest, Triceps", reps: "3 sets to failure", duration: "5 mins", img: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1446" },
        ];
        await Exercise.insertMany(DEFAULT_EXERCISES);
      }
    } catch (err) {
      console.error("❌ Failed to seed default exercises:", err);
    }

    // Migration: Populate missing qrIdentifiers for existing members in real database
    const membersWithoutQr = await Member.find({
      $or: [
        { qrIdentifier: { $exists: false } },
        { qrIdentifier: null }
      ]
    });
    if (membersWithoutQr.length > 0) {
      console.log(`🌱 Migrating ${membersWithoutQr.length} real DB members without QR identifiers...`);
      const crypto = await import("crypto");
      for (const m of membersWithoutQr) {
        m.qrIdentifier = "qr_" + crypto.randomUUID().replace(/-/g, "");
        m.qrCreatedAt = new Date();
        await m.save();
      }
      console.log("🌱 Real DB QR identifier migration completed successfully.");
    }

    console.log("🌱 Idempotent seeding completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed real database:", error);
  }
}

export async function connectToDatabase() {
  if (process.env.NODE_ENV === "production" && !process.env.INITIAL_ADMIN_PASSWORD) {
    throw new Error("INITIAL_ADMIN_PASSWORD environment variable is missing.");
  }

  if (global.useMockDatabase) {
    initMockDatabase();
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "crestDB",
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("🔋 Connected successfully to MongoDB Atlas database.");
    await seedDatabaseIfEmpty();
    global.databaseConnectionError = null;
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    console.warn("Reason:", e.message);
    console.warn("❌ MongoDB connection failed. Activating local JSON database fallback.");
    global.useMockDatabase = true;
    global.databaseConnectionError = e.message || String(e);
    initMockDatabase();
  }

  return cached.conn;
}
