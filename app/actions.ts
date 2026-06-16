"use server";

import { addMonths } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, createSession, hashPassword, requireAdmin, requireUser, verifyPassword } from "@/lib/auth";
import { balanceFor, totalDue as calculateTotalDue } from "@/lib/loan-math";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const accountSettingsSchema = z.object({
  email: z.string().email(),
  phone: z.string().trim().max(50).optional()
});

const passwordSettingsSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

function redirectSettings(status: "account-saved" | "password-saved" | "staff-password-saved" | "staff-status-saved" | "invalid-account" | "invalid-password" | "email-taken" | "current-password-wrong" | "staff-password-short"): never {
  redirect(`/settings?status=${status}`);
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) return { error: "Invalid login credentials." };

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid login credentials." };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

async function notifyAdmin(args: { category: string; entityId: string; title: string; message: string; user: { id: string; name: string; role: string } }) {
  if (args.user.role !== "STAFF") return;

  await prisma.notification.create({
    data: {
      category: args.category,
      entityId: args.entityId,
      title: args.title,
      message: args.message,
      createdById: args.user.id,
      createdByName: args.user.name
    }
  });
}

async function collectBorrowerLinkedIds(borrowerId: string) {
  const loans = await prisma.loan.findMany({
    where: { borrowerId },
    select: {
      id: true,
      repayments: {
        select: { id: true }
      }
    }
  });

  return {
    loanIds: loans.map((loan) => loan.id),
    repaymentIds: loans.flatMap((loan) => loan.repayments.map((repayment) => repayment.id))
  };
}

async function deleteBorrowerNotifications(args: { borrowerId: string; loanIds: string[]; repaymentIds: string[] }) {
  const conditions: Array<{ category: string; entityId: string | { in: string[] } }> = [
    { category: "BORROWERS", entityId: args.borrowerId }
  ];

  if (args.loanIds.length) {
    conditions.push({ category: "LOANS", entityId: { in: args.loanIds } });
  }

  if (args.repaymentIds.length) {
    conditions.push({ category: "REPAYMENTS", entityId: { in: args.repaymentIds } });
  }

  await prisma.notification.deleteMany({
    where: {
      OR: conditions
    }
  });
}

export async function createBorrowerAction(formData: FormData) {
  const user = await requireUser();
  const data = Object.fromEntries(formData);
  const borrower = await prisma.borrower.create({
    data: {
      fullName: String(data.fullName),
      phone: String(data.phone),
      nationalId: String(data.nationalId),
      address: String(data.address),
      occupation: String(data.occupation),
      emergencyContact: String(data.emergencyContact),
      notes: String(data.notes || ""),
      kycStatus: "PENDING"
    }
  });

  await notifyAdmin({
    category: "BORROWERS",
    entityId: borrower.id,
    title: "New borrower submitted",
    message: `${user.name} added borrower ${borrower.fullName}. KYC is pending admin review.`,
    user
  });

  revalidatePath("/borrowers");
  revalidatePath("/dashboard");
}

export async function createStaffAction(formData: FormData) {
  await requireAdmin();
  const data = Object.fromEntries(formData);
  await prisma.user.create({
    data: {
      name: String(data.name),
      email: String(data.email),
      phone: String(data.phone || ""),
      role: String(data.role),
      branchId: String(data.branchId),
      passwordHash: await hashPassword(String(data.password || "staff123"))
    }
  });
  revalidatePath("/staff");
}

export async function createBranchAction(formData: FormData) {
  await requireAdmin();
  const data = Object.fromEntries(formData);
  await prisma.branch.create({
    data: {
      name: String(data.name),
      code: String(data.code).toUpperCase(),
      address: String(data.address),
      phone: String(data.phone || "")
    }
  });
  revalidatePath("/branches");
}

export async function createLoanAction(formData: FormData) {
  const user = await requireUser();
  const data = Object.fromEntries(formData);
  const startDate = new Date(String(data.startDate));
  const durationMonths = Number(data.durationMonths);
  const lastLoan = await prisma.loan.count();
  const isAdmin = user.role === "ADMIN";
  const status = isAdmin ? String(data.status || "PENDING") : "PENDING";
  const assignedOfficerId = isAdmin ? String(data.assignedOfficerId) : user.id;
  const branchId = isAdmin ? String(data.branchId) : String(user.branchId || data.branchId);

  const loan = await prisma.loan.create({
    data: {
      loanNumber: `TC-LN-${String(lastLoan + 1).padStart(4, "0")}`,
      borrowerId: String(data.borrowerId),
      amount: Number(data.amount),
      interestRate: Number(data.interestRate),
      durationMonths,
      startDate,
      dueDate: addMonths(startDate, durationMonths),
      status,
      approvedAt: status === "PENDING" ? null : new Date(),
      assignedOfficerId,
      branchId,
      notes: String(data.notes || ""),
      latePenaltyAmount: Number(data.latePenaltyAmount || 0),
      extraInterestRate: Number(data.extraInterestRate || 0),
      guarantors: {
        create: {
          fullName: String(data.guarantorName),
          phone: String(data.guarantorPhone),
          relationship: String(data.guarantorRelationship),
          address: String(data.guarantorAddress),
          identification: String(data.guarantorIdentification)
        }
      }
    }
  });

  const totalDue = calculateTotalDue(loan);
  const monthly = totalDue / durationMonths;
  for (let i = 1; i <= durationMonths; i++) {
    await prisma.repaymentSchedule.create({
      data: {
        loanId: loan.id,
        dueDate: addMonths(startDate, i),
        amountDue: i === durationMonths ? totalDue - monthly * (durationMonths - 1) : monthly
      }
    });
  }

  await notifyAdmin({
    category: "LOANS",
    entityId: loan.id,
    title: "New loan submitted",
    message: `${user.name} submitted loan ${loan.loanNumber}. It is pending admin approval.`,
    user
  });

  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function recordRepaymentAction(formData: FormData) {
  const user = await requireUser();
  const data = Object.fromEntries(formData);
  const loanId = String(data.loanId);

  const repayment = await prisma.repayment.create({
    data: {
      loanId,
      amountPaid: Number(data.amountPaid),
      paymentDate: new Date(String(data.paymentDate)),
      method: String(data.method),
      reference: String(data.reference || ""),
      notes: String(data.notes || ""),
      recordedById: user.id
    }
  });

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { repayments: true }
  });
  if (loan) {
    if (balanceFor(loan) <= 0) {
      await prisma.loan.update({ where: { id: loanId }, data: { status: "COMPLETED" } });
      await prisma.repaymentSchedule.updateMany({ where: { loanId }, data: { status: "PAID" } });
    }
  }

  await notifyAdmin({
    category: "REPAYMENTS",
    entityId: repayment.id,
    title: "New repayment recorded",
    message: `${user.name} recorded a repayment for review.`,
    user
  });

  revalidatePath("/repayments");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function updateBorrowerKycAction(formData: FormData) {
  await requireAdmin();
  const borrowerId = String(formData.get("borrowerId"));
  const kycStatus = String(formData.get("kycStatus"));

  await prisma.borrower.update({
    where: { id: borrowerId },
    data: { kycStatus }
  });
  await prisma.notification.updateMany({
    where: { category: "BORROWERS", entityId: borrowerId },
    data: { read: true }
  });

  revalidatePath("/borrowers");
  revalidatePath("/dashboard");
}

export async function resetBorrowerAction(formData: FormData) {
  await requireAdmin();
  const borrowerId = String(formData.get("borrowerId"));
  const { loanIds, repaymentIds } = await collectBorrowerLinkedIds(borrowerId);

  await deleteBorrowerNotifications({ borrowerId, loanIds, repaymentIds });

  if (loanIds.length) {
    await prisma.loan.deleteMany({
      where: { borrowerId }
    });
  }

  await prisma.borrower.update({
    where: { id: borrowerId },
    data: { kycStatus: "PENDING" }
  });

  revalidatePath("/borrowers");
  revalidatePath("/loans");
  revalidatePath("/repayments");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
}

export async function deleteBorrowerAction(formData: FormData) {
  await requireAdmin();
  const borrowerId = String(formData.get("borrowerId"));
  const { loanIds, repaymentIds } = await collectBorrowerLinkedIds(borrowerId);

  await deleteBorrowerNotifications({ borrowerId, loanIds, repaymentIds });

  if (loanIds.length) {
    await prisma.loan.deleteMany({
      where: { borrowerId }
    });
  }

  await prisma.borrower.delete({
    where: { id: borrowerId }
  });

  revalidatePath("/borrowers");
  revalidatePath("/loans");
  revalidatePath("/repayments");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
}

export async function updateLoanStatusAction(formData: FormData) {
  await requireAdmin();
  const loanId = String(formData.get("loanId"));
  const status = String(formData.get("status"));

  await prisma.loan.update({
    where: { id: loanId },
    data: {
      status,
      approvedAt: status === "PENDING" ? null : new Date()
    }
  });
  await prisma.notification.updateMany({
    where: { category: "LOANS", entityId: loanId },
    data: { read: true }
  });

  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function markNotificationGroupReadAction(formData: FormData) {
  await requireAdmin();
  const category = String(formData.get("category"));
  await prisma.notification.updateMany({
    where: { category },
    data: { read: true }
  });

  revalidatePath("/borrowers");
  revalidatePath("/loans");
  revalidatePath("/repayments");
  revalidatePath("/dashboard");
}

export async function updateCurrentUserAccountAction(formData: FormData) {
  const currentUser = await requireUser();
  const parsed = accountSettingsSchema.safeParse({
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || "")
  });

  if (!parsed.success) {
    redirectSettings("invalid-account");
  }

  const data = parsed.data;

  const emailInUse = await prisma.user.findFirst({
    where: {
      email: data.email,
      id: { not: currentUser.id }
    },
    select: { id: true }
  });

  if (emailInUse) {
    redirectSettings("email-taken");
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      email: data.email,
      phone: data.phone || null
    }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirectSettings("account-saved");
}

export async function updateCurrentUserPasswordAction(formData: FormData) {
  const currentUser = await requireUser();
  const parsed = passwordSettingsSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") || ""),
    newPassword: String(formData.get("newPassword") || ""),
    confirmPassword: String(formData.get("confirmPassword") || "")
  });

  if (!parsed.success) {
    redirectSettings("invalid-password");
  }

  const data = parsed.data;

  const userWithPassword = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true }
  });

  if (!userWithPassword || !(await verifyPassword(data.currentPassword, userWithPassword.passwordHash))) {
    redirectSettings("current-password-wrong");
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      passwordHash: await hashPassword(data.newPassword)
    }
  });

  revalidatePath("/settings");
  redirectSettings("password-saved");
}

export async function resetStaffPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const staffId = String(formData.get("staffId") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (newPassword.length < 8) {
    redirectSettings("staff-password-short");
  }

  await prisma.user.update({
    where: { id: staffId },
    data: {
      passwordHash: await hashPassword(newPassword)
    }
  });

  await prisma.notification.create({
    data: {
      category: "STAFF",
      entityId: staffId,
      title: "Password reset",
      message: `${admin.name} reset a staff password from Settings.`,
      createdById: admin.id,
      createdByName: admin.name,
      read: true
    }
  });

  revalidatePath("/settings");
  revalidatePath("/staff");
  redirectSettings("staff-password-saved");
}

export async function toggleStaffActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const staffId = String(formData.get("staffId") || "");
  const makeActive = String(formData.get("makeActive")) === "true";

  if (staffId === admin.id) {
    redirectSettings("staff-status-saved");
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { isActive: makeActive }
  });

  await prisma.notification.create({
    data: {
      category: "STAFF",
      entityId: staffId,
      title: makeActive ? "Staff reactivated" : "Staff deactivated",
      message: `${admin.name} ${makeActive ? "reactivated" : "deactivated"} a staff account from Settings.`,
      createdById: admin.id,
      createdByName: admin.name,
      read: true
    }
  });

  revalidatePath("/settings");
  revalidatePath("/staff");
  redirectSettings("staff-status-saved");
}
