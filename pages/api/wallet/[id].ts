import prisma from "../../../lib/prisma";
import {getSession} from "next-auth/client";

export default async function handle(req, res) {
    const session = await getSession({req});
    console.log(session)
    console.log('wallet delete function is implementing')
    const walletId = req.query.id;
    console.log(walletId);
    if (req.method === 'DELETE') {
        await prisma.wallet.delete({
            where: {id: String(walletId)},
        });

        console.log('delete done')
    } else {
        throw new Error(
            `The HTTP ${req.method} method is not supported at this route.`,
        );
    }
}
