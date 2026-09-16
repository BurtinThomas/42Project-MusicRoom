"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const POOL_SIZE = parseInt(process.env.POOL_SIZE || '200', 10);
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await argon2.hash('password123');
    console.log(`Seeding ${POOL_SIZE} load-test users...`);
    for (let i = 0; i < POOL_SIZE; i++) {
        await prisma.user.upsert({
            where: { email: `loadtest${i}@musicroom.test` },
            create: {
                email: `loadtest${i}@musicroom.test`,
                passwordHash,
                displayName: `Load Test ${i}`,
                emailVerified: true,
            },
            update: {},
        });
    }
    const owner = await prisma.user.upsert({
        where: { email: 'loadtest-owner@musicroom.test' },
        create: {
            email: 'loadtest-owner@musicroom.test',
            passwordHash,
            displayName: 'Load Test Owner',
            emailVerified: true,
        },
        update: {},
    });
    const event = await prisma.event.create({
        data: { ownerId: owner.id, name: 'k6 Load Test Event' },
    });
    const track = await prisma.track.create({ data: { title: 'Seed Track', artist: 'k6' } });
    await prisma.eventTrack.create({ data: { eventId: event.id, trackId: track.id, addedById: owner.id } });
    const playlist = await prisma.playlist.create({
        data: { ownerId: owner.id, name: 'k6 Load Test Playlist', requiresPaidPlan: true },
    });
    await prisma.user.update({ where: { id: owner.id }, data: { subscriptionPlan: 'PAID' } });
    console.log('EVENT_ID=', event.id);
    console.log('PLAYLIST_ID=', playlist.id);
    console.log('Run k6 with:');
    console.log(`  EVENT_ID=${event.id} PLAYLIST_ID=${playlist.id} POOL_SIZE=${POOL_SIZE} k6 run scripts/k6-scenario.js`);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-load-test.js.map