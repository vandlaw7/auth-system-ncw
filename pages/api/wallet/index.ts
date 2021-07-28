import {getSession} from 'next-auth/client';
import prisma from "../../../lib/prisma";
import {PrismaClient, Prisma} from '@prisma/client'

const client = new PrismaClient()

export default handle

async function handle(req, res) {
    console.log("api/wallet")
    const {address, chain, publicAddress, user_id} = req.body;
    console.log(req.body)

    if (req.method === 'POST') {
        // metamask 로 로그인하는 경우임
        if (publicAddress) {
            const wallet = await prisma.wallet.findUnique({
                where: {
                    address: publicAddress
                }
            })
            if (wallet) {
                res.json({nonce: wallet.nonce});
            } else {
                // 등록된 지갑이 아니라면, 해당 지갑으로 임시 유저를 만들어준다.
                console.log("first login with metamask")
                const user = await client.user.create({
                    data: {
                        name: `${publicAddress} metamask user`,
                    }
                })
                await client.wallet.create({
                    data: {
                        address: publicAddress,
                        chain: chain,
                        master: {connect: {id: user.id}},
                        // 이 논스로 나중에 로그인을 하게 된다.
                        nonce: Math.floor(Math.random() * 10000)
                    },
                });
                const user_id = user.id
                console.log(user_id)
                res.json({user_id})
            }
        }

        // 지갑 등록하는 경우임
        try {
            const result = await client.wallet.create({
                data: {
                    address: address,
                    chain: chain,
                    master:{connect: {id: user_id } } ,
                    nonce: Math.floor(Math.random() * 10000)
                },
            });
            console.log("result", result);
            res.json(result);
        } catch (e) {
            // 지갑이 중복 등록되려고 하는 경우
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                // The .code property can be accessed in a type-safe manner
                if (e.code === 'P2002') {
                    console.log(
                        'There is a unique constraint violation, a new user cannot be created with this email'
                    )
                    res.status(500).json({
                        error: 'unique address error',
                        code: 'P2002'
                    })
                }
            }
            // throw e

        }
    } else {
        throw new Error(
            `The HTTP ${req.method} method is not supported at this route.`,
        );
    }


}
