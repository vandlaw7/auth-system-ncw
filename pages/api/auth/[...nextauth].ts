import {NextApiHandler} from 'next';
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import Adapters from 'next-auth/adapters';
import prisma from '../../../lib/prisma';

import {recoverPersonalSignature} from 'eth-sig-util';
import {bufferToHex} from 'ethereumjs-util';


const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options);
export default authHandler;

const callbacks = {
    // 이 user 는 authorize 함수가 return 한 user 임.
    async jwt(token, user) {
        // 이렇게 user 정보를 token 에 담아주고, 아래 함수에서 또 session 에 담아준다.
        if (user) {
            token.name = user.name;
            token.user_id =user.id;
            token.email = user.email
        }

        return token
    },
    async session(session, token) {

        session.name = token.name;
        session.user_id = token.user_id;
        session.email = token.email

        console.log('------------------');
        return session;
    }
}

const options = {
    providers: [
        Providers.Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
        Providers.Twitter({
            clientId: process.env.TWITTER_ID,
            clientSecret: process.env.TWITTER_SECRET,
        }),
        Providers.Discord({
            clientId: process.env.DISCORD_ID,
            clientSecret: process.env.DISCORD_SECRET,
        }),
        Providers.Email({
            server: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
            },
            from: process.env.SMTP_FROM
        }),
        Providers.Credentials({
            // The name to display on the sign in form (e.g. 'Sign in with...')
            name: 'Credentials',
            // The credentials is used to generate a suitable form on the sign in page.
            // You can specify whatever fields you are expecting to be submitted.
            // e.g. domain, username, password, 2FA token, etc.
            // 이 걸 지우면 Log in 창에서 credential login 이 안 보임.
            // credentials: {
            //     address: { label: "address", type: "text", placeholder: "0x00000" },
            //     nonce: {  label: "nonce", type: "password" }
            // },
            async authorize(credentials, req) {
                try {
                    console.log("credentials!!")

                    // 이미 유저 계정이 있는 경우
                    if (!credentials.user_id){
                        const msg = `I am signing my one-time nonce: ${credentials.nonce}`;
                        const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
                        const address = recoverPersonalSignature({
                            data: msgBufferHex,
                            sig: credentials.signature,
                        });
                        if (address == credentials.publicAddress){

                            const wallet = await prisma.wallet.findUnique({
                                where: {address: credentials.publicAddress}
                            })

                            if (wallet.nonce == Number(credentials.nonce)){
                                await prisma.wallet.update({
                                    where: {id: wallet.id},
                                    data: {
                                        nonce: Math.floor(Math.random() * 10000)
                                    }
                                })

                                const user = await prisma.user.findUnique({
                                    where: {id: wallet.masterId}
                                })
                                return user
                            }
                        }
                    }
                    // wallet으로 처음 로그인하여 유저를 바로 만들어준 경우
                    else {
                        return await prisma.user.findUnique({
                            where: {id: credentials.user_id}
                        })
                    }

                } catch (e){
                    console.log(e)
                    // Redirecting to the login page with error message in the URL
                    // throw new Error(errorMessage)
                    return null
                }

            }
        })
    ],
    adapter: Adapters.Prisma.Adapter({ prisma }),
    secret: process.env.SECRET,

    session: {
        jwt: true
    },
    callbacks,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
};