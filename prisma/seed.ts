import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Create default groups
    const groups = ["Network", "Software", "Hardware", "General Support"];

    for (const name of groups) {
        await prisma.group.upsert({
            where: { name },
            update: {},
            create: {
                name,
                description: `${name} support team`,
            },
        });
    }

    // Create a demo admin if no users exist
    const userCount = await prisma.user.count();
    if (userCount === 0) {
        const passwordHash = await bcrypt.hash("admin123", 12);
        await prisma.user.create({
            data: {
                name: "Admin User",
                email: "admin@supportdesk.local",
                passwordHash,
                role: "ADMIN",
            },
        });
        console.log("Created admin user: admin@supportdesk.local / admin123");
    }

    console.log(`Seeded ${groups.length} groups`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
