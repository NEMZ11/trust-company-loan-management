import { addMonths, subDays } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.repayment.deleteMany();
  await prisma.repaymentSchedule.deleteMany();
  await prisma.guarantor.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.borrower.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const [headOffice, eastBranch] = await Promise.all([
    prisma.branch.create({
      data: {
        name: "Trust Company Head Office",
        code: "HQ",
        address: "Central Business District",
        phone: "+1 555 0100"
      }
    }),
    prisma.branch.create({
      data: {
        name: "Trust Company East Branch",
        code: "EAST",
        address: "East Commercial Avenue",
        phone: "+1 555 0199"
      }
    })
  ]);

  const passwordHash = await hash("admin123", 10);
  const staffPasswordHash = await hash("staff123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Grace Mensah",
      email: "admin@trustcompany.local",
      passwordHash,
      role: "ADMIN",
      phone: "+1 555 0130",
      branchId: headOffice.id
    }
  });

  const officerA = await prisma.user.create({
    data: {
      name: "Daniel Okoro",
      email: "daniel@trustcompany.local",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      phone: "+1 555 0141",
      branchId: headOffice.id
    }
  });

  const officerB = await prisma.user.create({
    data: {
      name: "Amina Bello",
      email: "amina@trustcompany.local",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      phone: "+1 555 0142",
      branchId: eastBranch.id
    }
  });

  const borrowers = await Promise.all([
    prisma.borrower.create({
      data: {
        fullName: "Samuel Carter",
        phone: "+1 555 2101",
        nationalId: "TC-ID-1001",
        address: "14 Market Road",
        occupation: "Hardware Store Owner",
        emergencyContact: "Nora Carter, +1 555 2201",
        notes: "Strong repayment history from previous land purchase.",
        kycStatus: "VERIFIED"
      }
    }),
    prisma.borrower.create({
      data: {
        fullName: "Lydia Johnson",
        phone: "+1 555 2102",
        nationalId: "TC-ID-1002",
        address: "88 Riverside Estate",
        occupation: "Catering Business",
        emergencyContact: "Paul Johnson, +1 555 2202",
        notes: "Business cash flow is seasonal.",
        kycStatus: "VERIFIED"
      }
    }),
    prisma.borrower.create({
      data: {
        fullName: "Michael Adeyemi",
        phone: "+1 555 2103",
        nationalId: "TC-ID-1003",
        address: "7 Builder Close",
        occupation: "Contractor",
        emergencyContact: "Tola Adeyemi, +1 555 2203",
        notes: "Pending utility bill verification.",
        kycStatus: "PENDING"
      }
    }),
    prisma.borrower.create({
      data: {
        fullName: "Fatima Yusuf",
        phone: "+1 555 2104",
        nationalId: "TC-ID-1004",
        address: "22 Green Villa",
        occupation: "Textile Trader",
        emergencyContact: "Hassan Yusuf, +1 555 2204",
        notes: "Requires senior approval for new facility.",
        kycStatus: "REJECTED"
      }
    })
  ]);

  async function createLoan(args: {
    number: string;
    borrowerIndex: number;
    amount: number;
    interest: number;
    months: number;
    startOffsetDays: number;
    status: string;
    officerId: string;
    branchId: string;
    paid?: number;
    latePenalty?: number;
  }) {
    const startDate = subDays(new Date(), args.startOffsetDays);
    const dueDate = addMonths(startDate, args.months);
    const totalDue = args.amount + args.amount * (args.interest / 100);
    const monthly = Math.round(totalDue / args.months);

    const loan = await prisma.loan.create({
      data: {
        loanNumber: args.number,
        borrowerId: borrowers[args.borrowerIndex].id,
        amount: args.amount,
        interestRate: args.interest,
        durationMonths: args.months,
        startDate,
        dueDate,
        status: args.status,
        latePenaltyAmount: args.latePenalty ?? 0,
        notes: "Demo loan facility for Trust Company operations.",
        approvedAt: args.status === "PENDING" ? null : subDays(startDate, -1),
        assignedOfficerId: args.officerId,
        branchId: args.branchId,
        guarantors: {
          create: {
            fullName: `${borrowers[args.borrowerIndex].fullName.split(" ")[0]} Guarantor`,
            phone: "+1 555 3300",
            relationship: "Business Partner",
            address: "Guarantor verified address",
            identification: `${args.number}-GID`
          }
        }
      }
    });

    for (let i = 1; i <= args.months; i++) {
      const scheduleDue = addMonths(startDate, i);
      await prisma.repaymentSchedule.create({
        data: {
          loanId: loan.id,
          dueDate: scheduleDue,
          amountDue: i === args.months ? totalDue - monthly * (args.months - 1) : monthly,
          status:
            args.status === "COMPLETED"
              ? "PAID"
              : scheduleDue < new Date() && args.status !== "COMPLETED"
                ? "OVERDUE"
                : "PENDING"
        }
      });
    }

    if (args.paid) {
      await prisma.repayment.create({
        data: {
          loanId: loan.id,
          amountPaid: args.paid,
          paymentDate: subDays(new Date(), Math.min(args.startOffsetDays, 10)),
          method: "BANK_TRANSFER",
          reference: `PAY-${args.number}`,
          notes: "Seed repayment",
          recordedById: args.officerId
        }
      });
    }

    return loan;
  }

  await createLoan({
    number: "TC-LN-0001",
    borrowerIndex: 0,
    amount: 12000,
    interest: 12,
    months: 8,
    startOffsetDays: 120,
    status: "ACTIVE",
    officerId: officerA.id,
    branchId: headOffice.id,
    paid: 6500
  });

  await createLoan({
    number: "TC-LN-0002",
    borrowerIndex: 1,
    amount: 9000,
    interest: 10,
    months: 6,
    startOffsetDays: 250,
    status: "DEFAULTED",
    officerId: officerB.id,
    branchId: eastBranch.id,
    paid: 2600,
    latePenalty: 350
  });

  await createLoan({
    number: "TC-LN-0003",
    borrowerIndex: 2,
    amount: 15000,
    interest: 14,
    months: 10,
    startOffsetDays: 20,
    status: "PENDING",
    officerId: officerA.id,
    branchId: headOffice.id
  });

  await createLoan({
    number: "TC-LN-0004",
    borrowerIndex: 0,
    amount: 5000,
    interest: 8,
    months: 4,
    startOffsetDays: 190,
    status: "COMPLETED",
    officerId: admin.id,
    branchId: headOffice.id,
    paid: 5400
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
