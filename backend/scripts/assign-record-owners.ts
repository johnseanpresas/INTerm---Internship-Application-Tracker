import prisma from "../src/lib/prisma"

async function main() {
    const email = process.argv[2]
        ?.replace("[at]", "@")
        .trim()
        .toLowerCase()

    if (!email) {
        throw new Error("Provide the account email as a command argument.")
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
        },
    })

    if (!user) {
        throw new Error("That account does not exist. No records were changed.")
    }

    const result = await prisma.$transaction(async (tx) => {
        // Only assign applications that do not already have an owner.
        const applications = await tx.application.updateMany({
            where: {
                userId: null,
            },
            data: {
                userId: user.id,
            },
        })

        // Assign standalone tasks and tasks linked to this user's applications.
        const tasks = await tx.task.updateMany({
            where: {
                userId: null,
                OR: [
                    { applicationId: null },
                    { application: { userId: user.id } },
                ],
            },
            data: {
                userId: user.id,
            },
        })

        const remainingTasks = await tx.task.count({
            where: {
                userId: null,
            },
        })

        if (remainingTasks > 0) {
            throw new Error(
                "Some unowned tasks link to another user's applications. All changes were rolled back."
            )
        }

        return {
            applicationsAssigned: applications.count,
            tasksAssigned: tasks.count,
        }
    })

    console.log(`Assigned existing records to ${user.email}`)
    console.log(result)
}

main()
    .catch((error) => {
        console.error(
            error instanceof Error ? error.message : "Assignment failed."
        )
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })