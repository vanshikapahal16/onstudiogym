import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendForbidden, sendError, sendNotFound } from "@/utils/response";

// GET /api/admin/management (List all administrators)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }
    if (decoded.role !== "superadmin") {
      return sendForbidden("Only superadmins can manage administrator accounts");
    }

    await connectToDatabase();

    const admins = await Admin.find({}).select("-hashedPassword -password").sort({ createdAt: -1 });
    return sendSuccess("Admins loaded successfully", { admins });
  } catch (error) {
    return sendError("Failed to fetch admin accounts", error, 500);
  }
}

// POST /api/admin/management (Create a new administrator)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }
    if (decoded.role !== "superadmin") {
      return sendForbidden("Only superadmins can manage administrator accounts");
    }

    await connectToDatabase();

    const { name, email, phone, password, role } = await req.json();

    if (!name || !phone || !password || !role) {
      return sendError("Please provide all required fields (name, phone, password, role)", null, 400);
    }

    if (!["superadmin", "admin"].includes(role)) {
      return sendError("Invalid role. Must be 'superadmin' or 'admin'", null, 400);
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email && email.trim() !== "" ? email.trim().toLowerCase() : null;

    // Check phone uniqueness
    const existingPhone = await Admin.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return sendError("An administrator with this phone number already exists", null, 400);
    }

    // Check email uniqueness (if provided)
    if (cleanEmail) {
      const existingEmail = await Admin.findOne({ email: cleanEmail });
      if (existingEmail) {
        return sendError("An administrator with this email address already exists", null, 400);
      }
    }

    const adminData: any = {
      name,
      phone: cleanPhone,
      role,
      password,
      isActive: true,
    };
    if (cleanEmail) {
      adminData.email = cleanEmail;
    }

    const newAdmin = await Admin.create(adminData);

    const adminObj = newAdmin.toObject ? newAdmin.toObject() : newAdmin;
    delete adminObj.hashedPassword;
    delete adminObj.password;

    return sendSuccess("Administrator created successfully", { admin: adminObj }, 201);
  } catch (error) {
    return sendError("Failed to create administrator account", error, 500);
  }
}

// DELETE /api/admin/management (Delete an administrator)
export async function DELETE(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }
    if (decoded.role !== "superadmin") {
      return sendForbidden("Only superadmins can manage administrator accounts");
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return sendError("Please provide the administrator ID to delete", null, 400);
    }

    // Prevent a superadmin from deleting themselves
    if (decoded.id === id) {
      return sendError("You cannot delete your own account!", null, 400);
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return sendNotFound("Administrator account not found");
    }

    // Safety: prevent deleting primary owner/admin (Vanshika)
    if (admin.phone === "9588715527") {
      return sendError("You cannot delete the primary owner account!", null, 400);
    }

    await Admin.findByIdAndDelete(id);

    return sendSuccess("Administrator account deleted successfully");
  } catch (error) {
    return sendError("Failed to delete administrator account", error, 500);
  }
}
