import React, {useEffect, useRef} from "react"
import {GetServerSideProps, GetStaticProps} from "next"
import Layout from "../components/Layout"
import Post, {WalletProps} from "../components/Wallet"

import prisma from '../lib/prisma';
import {getSession, useSession} from "next-auth/client";
import Router from "next/router";

// 이 페이지가 로드될 때 서버에 요청해서 데이터를 불러옴. 렌더링 이전에 실행됨.
export const getServerSideProps: GetServerSideProps = async ({req, res}) => {

    const session = await getSession({req});
    // console.log("index.tx getServerSideProps session")
    // console.log(session)
    if (session) {
        const feed = await prisma.wallet.findMany({
            where: {
                master: {id: session.user_id}
            }
        });
        return {props: {feed}};
    } else {
        const feed = await prisma.wallet.findMany({
            where: {
                master: {email: ""}
            }
        });
        return {props: {feed}};
    }
};


type Props = {
    feed: WalletProps[]
}

declare global {
    interface Window {
        ethereum: any,
        web3: any
    }
}

let accounts;

const Blog: React.FC<Props> = (props) => {
    const [session, loading] = useSession()
    console.log("session in index.ts Component function ")
    console.log(session);


    useEffect(() => {
        async function listenMMAccount() {
            window.ethereum.on("accountsChanged", async function() {
                // Time to reload your interface with accounts[0]!
                accounts = window.ethereum.send('eth_requestAccounts');
                // accounts = await web3.eth.getAccounts();

                alert("Your metamask account is changed");
                console.log(accounts);
            });
        }
        listenMMAccount();
    }, []);

    const metamaskConnect = async () => {
        const ethereum = window.ethereum
        // ethereum.on('accountsChanged', handler: (accounts: Array<string>) => void);
        const accounts = await ethereum.send('eth_requestAccounts');
        // console.log(accounts);
        const address = accounts.result[0];
        // 일단은 이더리움만 취급하고, 나중에 확장하자.
        const chain = 'ethereum';
        const user_id = session.user_id;
        // console.log("user_id", user_id)
        const body = {address, chain, user_id};
        try {
            const result = await fetch('/api/wallet', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });
            // 중복 등록 방지. mongodb wallet model 의 address 를 unique 로 선언해놨음.
            const result_json = await result.json()
            if (result_json.code == 'P2002') {
                alert('This ethereum account is already enrolled')
            }

            Router.push('/');

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Layout>
            <div className="page">
                <main>
                    <button onClick={() => metamaskConnect()}>
                        <h3>wallet connect</h3>
                    </button>
                    <h3>Wallet list:</h3>
                    {props.feed.map((wallet) => (
                        <div key={wallet.id} className="post">
                            <Post wallet={wallet}/>
                        </div>
                    ))}


                </main>
            </div>
            <style jsx>{`
        .post {
          background: white;
          transition: box-shadow 0.1s ease-in;
        }
        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }
        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
        </Layout>
    )
}

export default Blog