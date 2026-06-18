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

// PATCH /api/admin/management (Promote a member to admin or Demote an admin to member)
export async function PATCH(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }
    if (decoded.role !== "superadmin") {
      return sendForbidden("Only superadmins can manage administrator accounts");
    }

    await connectToDatabase();

    const { action, id } = await req.json();

    if (!action || !id) {
      return sendError("Please provide action ('promote' or 'demote') and target ID", null, 400);
    }

    if (action === "promote") {
      // Promote member to admin
      const Member = (await import("@/models/Member")).default;
      const member = await Member.findById(id);
      if (!member) {
        return sendNotFound("Member not found");
      }

      // Check if already an admin
      const existingAdmin = await Admin.findOne({
        $or: [
          { phone: member.phone },
          ...(member.email ? [{ email: member.email.toLowerCase() }] : []),
        ],
      });

      if (existingAdmin) {
        return sendError("An administrator with this member's contact details already exists", null, 400);
      }

      // Generate a uniqueId based on name
      const baseUniqueId = member.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const uniqueSuffix = Math.floor(100 + Math.random() * 900);
      const uniqueId = `${baseUniqueId}${uniqueSuffix}`;

      // Create Admin record
      const newAdmin = await Admin.create({
        name: member.name,
        email: member.email ? member.email.toLowerCase() : undefined,
        phone: member.phone,
        uniqueId,
        hashedPassword: member.hashedPassword || "$2a$10$UnrealHashedPasswordPlaceholderForLoginSecurity",
        role: "admin",
        isActive: true,
      });

      // Update Member role
      member.role = "admin";
      await member.save();

      const adminObj = newAdmin.toObject ? newAdmin.toObject() : newAdmin;
      delete adminObj.hashedPassword;
      delete adminObj.password;

      return sendSuccess("Member successfully promoted to Administrator", { admin: adminObj });
    } else if (action === "demote") {
      // Demote admin to member
      // Prevent a superadmin from demoting themselves
      if (decoded.id === id) {
        return sendError("You cannot demote your own account!", null, 400);
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return sendNotFound("Administrator account not found");
      }

      // Safety: prevent demoting primary owner/admin (Vanshika)
      if (admin.phone === "9588715527") {
        return sendError("You cannot demote the primary owner account!", null, 400);
      }

      const Member = (await import("@/models/Member")).default;
      
      // Check if a member with this phone/email already exists
      let member = await Member.findOne({
        $or: [
          { phone: admin.phone },
          ...(admin.email ? [{ email: admin.email.toLowerCase() }] : []),
        ],
      });

      if (!member) {
        // Create matching Member record
        member = await Member.create({
          name: admin.name,
          phone: admin.phone,
          email: admin.email ? admin.email.toLowerCase() : `${admin.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@onfitness.com`,
          address: "Gym Office",
          hashedPassword: admin.hashedPassword,
          role: "member",
          approved: true,
          membershipActive: false,
          isActive: true,
        });
      } else {
        // Update existing member role to member
        member.role = "member";
        await member.save();
      }

      // Delete Admin record
      await Admin.findByIdAndDelete(id);

      return sendSuccess("Administrator successfully demoted to Member");
    } else {
      return sendError("Invalid action. Must be 'promote' or 'demote'", null, 400);
    }
  } catch (error) {
    return sendError("Failed to update administrator account", error, 500);
  }
}
